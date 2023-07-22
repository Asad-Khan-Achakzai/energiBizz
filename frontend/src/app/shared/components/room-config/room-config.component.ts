import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  HostListener,
  OnDestroy,
  ViewChild,
  ElementRef,
  ɵCompiler_compileModuleSync__POST_R3__
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { UserModel } from '../../models/user-model';
import { NicknameMatcher } from '../../forms-matchers/nickname';
import { UtilsService } from '../../services/utils/utils.service';
import { Publisher } from 'openvidu-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { IDevice, CameraType } from '../../types/device-type';
import { DevicesService } from '../../services/devices/devices.service';
import { interval, Subscription } from 'rxjs';
import { AvatarType } from '../../types/chat-type';
import { LoggerService } from '../../services/logger/logger.service';
import { ILogger } from '../../types/logger-type';
import { ScreenType } from '../../types/video-type';
import { ExternalConfigModel } from '../../models/external-config';
import { OvSettingsModel } from '../../models/ovSettings';
import { StorageService } from '../../services/storage/storage.service';
import { Storage } from '../../types/storage-type';
import { OpenViduErrorName } from 'openvidu-browser/lib/OpenViduInternal/Enums/OpenViduError';
import { OpenViduWebrtcService } from '../../services/openvidu-webrtc/openvidu-webrtc.service';
import { LocalUsersService } from '../../services/local-users/local-users.service';
import { TokenService } from '../../services/token/token.service';
import { AvatarService } from '../../services/avatar/avatar.service';
import { NumberDictionary, uniqueNamesGenerator } from 'unique-names-generator';
import { NetworkService } from '../../services/network/network.service';
import { environment } from 'src/environments/environment';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-room-config',
  templateUrl: './room-config.component.html',
  styleUrls: ['./room-config.component.css']
})

export class RoomConfigComponent implements OnInit, OnDestroy {
  @ViewChild('bodyCard') bodyCard: ElementRef;

  @Input() externalConfig: ExternalConfigModel;
  @Input() ovSettings: OvSettingsModel;
  @Output() join = new EventEmitter<any>();
  @Output() leaveSession = new EventEmitter<any>();

  // Webcomponent event
  @Output() publisherCreated = new EventEmitter<any>();

  mySessionId: string = '';
  taskId: string = '';
  count: number = 0;
  sessionIdafterleave: string = '';
  isShowRecord = false;

  cameras: IDevice[];
  microphones: IDevice[];
  camSelected: IDevice;
  micSelected: IDevice;
  isVideoActive = true;
  isAudioActive = true;
  screenShareEnabled: boolean;
  localUsers: UserModel[] = [];
  openviduAvatar: string;
  capturedAvatar: string;
  avatarTypeEnum = AvatarType;
  avatarSelected: AvatarType;
  columns: number;

  nicknameFormControl = new FormControl('', [Validators.maxLength(25), Validators.required]);
  emailFormControl = new FormControl('', [Validators.required, Validators.email]);
  passCode = new FormControl('', [Validators.required]);
  matcher = new NicknameMatcher();
  hasVideoDevices: boolean;
  hasAudioDevices: boolean;
  showConfigCard: boolean;
  disanleTranscribeButton = true;
  private log: ILogger;
  private oVUsersSubscription: Subscription;
  private screenShareStateSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private utilsSrv: UtilsService,
    private openViduWebRTCService: OpenViduWebrtcService,
    private localUsersService: LocalUsersService,
    private tokenService: TokenService,
    private oVDevicesService: DevicesService,
    private loggerSrv: LoggerService,
    private storageSrv: StorageService,
    private avatarService: AvatarService,
    private router: Router,
    private networkService: NetworkService,
    private firebaseService: FirebaseService
  ) {
    this.log = this.loggerSrv.get('RoomConfigComponent');
  }

  @HostListener('window:beforeunload')
  beforeunloadHandler() {
    this.close();
  }

  async ngOnInit() {
    console.log("ngOnInit: Room Config Component");
    const email = sessionStorage.getItem("email");
    if (email) {
      this.emailFormControl.setValue(email);
    }
    this.localUsersService.initialize();
    this.openViduWebRTCService.initialize();
    this.ovSettings = !!this.externalConfig ? this.externalConfig.getOvSettings() : new OvSettingsModel();
    this.sessionIdafterleave = localStorage.getItem("SessionId");
    this.taskId = localStorage.getItem("taskid");
    this.subscribeToLocalUsersEvents();
    this.initNicknameAndSubscribeToChanges();
    this.openviduAvatar = this.avatarService.getOpenViduAvatar();
    this.columns = window.innerWidth > 900 ? 2 : 1;
    this.setSessionName();
    await this.oVDevicesService.initDevices();
    this.setDevicesInfo();
    if (this.hasAudioDevices || this.hasVideoDevices) {
      await this.initwebcamPublisher();
    }
    else {
      // Emit publisher to webcomponent and angular-library
      this.emitPublisher(null);
      this.showConfigCard = true;
    }
  }

  ngAfterViewInit() {
    if (localStorage.getItem("isShowRecord") == 'true') {
      console.log("ngAfterViewInit: it is true");
      this.isShowRecord = true;
    }
    else {
      console.log("ngAfterViewInit: it is false");
      this.isShowRecord = false;
    }
  }

  ngOnDestroy() {
    if (this.oVUsersSubscription) {
      this.oVUsersSubscription.unsubscribe();
    }

    if (this.screenShareStateSubscription) {
      this.screenShareStateSubscription.unsubscribe();
    }
    this.oVDevicesService.clear();
  }

  async onCameraSelected(event: any) {
    const videoSource = event?.value;
    if (!!videoSource) {
      // Is New deviceId different from the old one?
      if (this.oVDevicesService.needUpdateVideoTrack(videoSource)) {
        const mirror = this.oVDevicesService.cameraNeedsMirror(videoSource);
        await this.openViduWebRTCService.replaceTrack(videoSource, null, mirror);
        this.oVDevicesService.setCamSelected(videoSource);
        this.camSelected = this.oVDevicesService.getCamSelected();
      }
      // Publish Webcam
      this.openViduWebRTCService.publishWebcamVideo(true);
      this.isVideoActive = true;
      return;
    }
    // Unpublish webcam
    this.openViduWebRTCService.publishWebcamVideo(false);
    this.isVideoActive = false;
  }

  async onMicrophoneSelected(event: any) {
    const audioSource = event?.value;

    if (!!audioSource) {
      // Is New deviceId different than older?
      if (this.oVDevicesService.needUpdateAudioTrack(audioSource)) {
        console.log("onMicrophoneSelected: ", this.camSelected);
        const mirror = this.oVDevicesService.cameraNeedsMirror(this.camSelected.device);
        await this.openViduWebRTCService.replaceTrack(null, audioSource, mirror);
        this.oVDevicesService.setMicSelected(audioSource);
        this.micSelected = this.oVDevicesService.getMicSelected();
      }
      // Publish microphone
      this.publishAudio(true);
      this.isAudioActive = true;
      return;
    }
    // Unpublish microhpone
    this.publishAudio(false);
    this.isAudioActive = false;
  }

  toggleCam() {
    this.isVideoActive = !this.isVideoActive;
    this.openViduWebRTCService.publishWebcamVideo(this.isVideoActive);

    if (this.localUsersService.areBothConnected()) {
      this.localUsersService.disableWebcamUser();
      this.openViduWebRTCService.publishScreenAudio(this.isAudioActive);
    }
    else
      if (this.localUsersService.isOnlyScreenConnected()) {
        this.localUsersService.enableWebcamUser();
      }
  }

  toggleScreenShare() {
    // Disabling screenShare
    if (this.localUsersService.areBothConnected()) {
      this.localUsersService.disableScreenUser();
      return;
    }

    // Enabling screenShare
    if (this.localUsersService.isOnlyWebcamConnected()) {
      const screenPublisher = this.initScreenPublisher();

      screenPublisher.on('accessAllowed', (event) => {
        screenPublisher.stream
          .getMediaStream()
          .getVideoTracks()[0]
          .addEventListener('ended', () => {
            this.log.d("toggleScreenShare: Clicked native stop button. Stopping screen sharing");
            this.toggleScreenShare();
          });
        this.localUsersService.enableScreenUser(screenPublisher);
        if (!this.localUsersService.hasWebcamVideoActive()) {
          this.localUsersService.disableWebcamUser();
        }
      });

      screenPublisher.on('accessDenied', (event) => {
        this.log.w("toggleScreenShare: ScreenShare - Access Denied");
      });
      return;
    }

    // Disabling screnShare and enabling webcam
    this.localUsersService.enableWebcamUser();
    this.localUsersService.disableScreenUser();
  }

  toggleMic() {
    this.isAudioActive = !this.isAudioActive;
    this.publishAudio(this.isAudioActive);
  }

  captureAvatar() {
    this.capturedAvatar = this.avatarService.createCapture();
  }

  initNicknameAndSubscribeToChanges() {
    if (this.externalConfig) {
      this.nicknameFormControl.setValue(this.externalConfig.getNickname());
      this.localUsersService.updateUsersNickname(this.externalConfig.getNickname());
      return;
    }
    const nickname = this.storageSrv.get(Storage.USER_NICKNAME) || this.utilsSrv.generateNickname();
    this.nicknameFormControl.setValue(nickname);
    this.localUsersService.updateUsersNickname(nickname);

    this.nicknameFormControl.valueChanges.subscribe((value) => {
      this.localUsersService.updateUsersNickname(value);
      this.storageSrv.set(Storage.USER_NICKNAME, value);
    });
  }

  eventKeyPress(event) {
    if (event && event.keyCode === 13 && this.nicknameFormControl.valid) {
      console.log("eventKeyPress: Call joinSession()");
      this.joinSession();
    }
  }
  onResize(event) {
    this.columns = event.target.innerWidth > 900 ? 2 : 1;
  }
  RoomConfig_MuteMe() {
    sessionStorage.setItem('userMuteedHimself', JSON.stringify(false));
    this.firebaseService.getDocument();
  }
  async joinSession() {

    console.log("joinSession: Call Token_SetEmail()");
    let sSessionID = this.tokenService.getSessionId();
    let oResponseOfSessionID: any = await this.networkService.NetworkService_CheckSessionID(sSessionID);
    let passCode = oResponseOfSessionID.PassCode;
    console.log("oResponseOfSessionID =", oResponseOfSessionID);
    console.log("this.passCode.value  =", this.passCode.value );

    let oResponseOfUser: any = await this.networkService.NetworkService_GetUserRole(sSessionID, this.emailFormControl.value);
    let oIsMuted = oResponseOfUser.IsMuted;
    sessionStorage.setItem("oIsMuted", JSON.stringify(oIsMuted));
    if (oResponseOfSessionID.Message != 'Session does not exist') {
      if (this.passCode.value == passCode) {
        if (oResponseOfSessionID.isLocked == 0) {
          if (this.emailFormControl.value) {
            if (oResponseOfUser.data == 'publisher') {
              sessionStorage.setItem("email", JSON.stringify(this.emailFormControl.value));
              sessionStorage.setItem("isShowRecord", JSON.stringify(true));
              let oResponse: any = await this.networkService.NetworkService_IsMuteAll(sSessionID);
              if (oResponse) {
                if (oResponse.IsMuted == 1) {
                  sessionStorage.setItem('isMuteAll', JSON.stringify(true));
                } else {
                  sessionStorage.setItem('isMuteAll', JSON.stringify(false));
                }
              }
            }
            else {
              sessionStorage.setItem("isShowRecord", JSON.stringify(false));
              this.RoomConfig_MuteMe();
            }
            this.tokenService.Token_SetEmail(this.emailFormControl.value);
            if (this.nicknameFormControl.valid) {
              this.avatarService.setFinalAvatar(this.avatarSelected);
              return this.join.emit();
            }
            this.scrollToBottom();
          }
          else {
            sessionStorage.setItem("isShowRecord", JSON.stringify(false));
            this.RoomConfig_MuteMe();
            if (this.nicknameFormControl.valid) {
              this.avatarService.setFinalAvatar(this.avatarSelected);
              return this.join.emit();
            }
            this.scrollToBottom();
          }
        }
        else if (oResponseOfSessionID.isLocked == 0 || (oResponseOfSessionID.OwnerEmail == this.emailFormControl.value && oResponseOfUser.data == 'publisher')) {
          if (this.emailFormControl.value) {
            if (oResponseOfUser.data == 'publisher') {
              sessionStorage.setItem("email", JSON.stringify(this.emailFormControl.value));
              sessionStorage.setItem("isShowRecord", JSON.stringify(true));
            }
            else {
              sessionStorage.setItem("isShowRecord", JSON.stringify(false));
              this.RoomConfig_MuteMe();
            }
            this.tokenService.Token_SetEmail(this.emailFormControl.value);
            if (this.nicknameFormControl.valid) {
              this.avatarService.setFinalAvatar(this.avatarSelected);
              return this.join.emit();
            }
            this.scrollToBottom();
            this.RoomConfig_MuteMe();
          }
          else {
            sessionStorage.setItem("isShowRecord", JSON.stringify(false));
            if (this.nicknameFormControl.valid) {
              this.avatarService.setFinalAvatar(this.avatarSelected);
              return this.join.emit();
            }
            this.scrollToBottom();
          }
        }
        else {
          alert('Session is locked ')
        }
      }
      else{
        alert('Invalid Pass Code');
      }
    }
      else {
        alert('Session does not exist');
      }
  }
  async createCall() {
    let oResponse = await this.networkService.Network_CallCreate("sohail.shan@zaxiss.com");
    console.log("createCall : Response : ", oResponse);
  }

  async getActiveSessions() {
    let oResponse = await this.networkService.Network_CallActiveSessions();
    console.log("getActiveSessions : Response : ", oResponse);
  }

  createSession() {
    console.log("createSession: For Email {%s}", this.emailFormControl.value);
    sessionStorage.setItem('email', this.emailFormControl.value);
    const text = ['energibizz'];
    const numberDictionary = NumberDictionary.generate({ min: 100, max: 9999 });
    this.mySessionId = uniqueNamesGenerator({ dictionaries: [text, numberDictionary], separator: '-', });
    const roomName = this.mySessionId.replace(/ /g, '-'); // replace white spaces by -
    this.setSessionName();
    //debugger;
    this.router.navigate(['/', roomName]);
    //debugger;
    console.log('made true');
    console.log(roomName);
    sessionStorage.setItem("isShowRecord", JSON.stringify(true));
  }

  close() {
    localStorage.setItem("SessionId", '');
    this.leaveSession.emit();
    this.showConfigCard = false;
    this.router.navigate(['/']);
  }

  onSelectAvatar(type: AvatarType) {
    this.avatarSelected = type;
  }

  async RoomConfig_GetRecordedFile() {
    //debugger;
    let emailId = sessionStorage.getItem("email");
    const res2 = await this.networkService.Network_SendEmail(this.sessionIdafterleave, emailId);
  }

  private setDevicesInfo() {
    this.hasVideoDevices = this.oVDevicesService.hasVideoDeviceAvailable();
    this.hasAudioDevices = this.oVDevicesService.hasAudioDeviceAvailable();
    this.microphones = this.oVDevicesService.getMicrophones();
    this.cameras = this.oVDevicesService.getCameras();
    this.camSelected = this.oVDevicesService.getCamSelected();
    this.micSelected = this.oVDevicesService.getMicSelected();
  }

  private setSessionName() {
    this.route.params.subscribe((params: Params) => {
      this.mySessionId = this.externalConfig ? this.externalConfig.getSessionName() : params.roomName;
      this.tokenService.setSessionId(this.mySessionId);
      sessionStorage.setItem('sessionId', this.mySessionId);
    });
  }

  private scrollToBottom(): void {
    try {
      this.bodyCard.nativeElement.scrollTop = this.bodyCard.nativeElement.scrollHeight;
    }
    catch (err) {

    }
  }

  private initScreenPublisher(): Publisher {
    const videoSource = ScreenType.SCREEN;
    const audioSource = this.hasAudioDevices ? undefined : null;
    const willThereBeWebcam = this.localUsersService.isWebCamEnabled() && this.localUsersService.hasWebcamVideoActive();
    const hasAudio = willThereBeWebcam ? false : this.hasAudioDevices && this.isAudioActive;
    const properties = this.openViduWebRTCService.createPublisherProperties(videoSource, audioSource, true, hasAudio, false);

    try {
      return this.openViduWebRTCService.initPublisher(undefined, properties);
    }
    catch (error) {
      this.log.e(error);
      this.utilsSrv.handlerScreenShareError(error);
    }
  }

  private publishAudio(audio: boolean) {
    this.localUsersService.isWebCamEnabled()
      ? this.openViduWebRTCService.publishWebcamAudio(audio)
      : this.openViduWebRTCService.publishScreenAudio(audio);
  }

  private subscribeToLocalUsersEvents() {
    this.oVUsersSubscription = this.localUsersService.OVUsers.subscribe((users) => {
      this.localUsers = users;
    });
    this.screenShareStateSubscription = this.localUsersService.screenShareState.subscribe((enabled) => {
      this.screenShareEnabled = enabled;
    });
  }

  private async initwebcamPublisher() {
    const micStorageDevice = this.micSelected?.device || undefined;
    const camStorageDevice = this.camSelected?.device || undefined;

    const videoSource = this.hasVideoDevices ? camStorageDevice : false;
    const audioSource = this.hasAudioDevices ? micStorageDevice : false;
    const publishAudio = this.hasAudioDevices ? this.isAudioActive : false;
    const publishVideo = this.hasVideoDevices ? this.isVideoActive : false;
    const mirror = this.camSelected && this.camSelected.type === CameraType.FRONT;
    const properties = this.openViduWebRTCService.createPublisherProperties(
      videoSource,
      audioSource,
      publishVideo,
      publishAudio,
      mirror
    );
    const publisher = await this.openViduWebRTCService.initPublisherAsync(undefined, properties);
    this.localUsersService.setWebcamPublisher(publisher);
    this.handlePublisherSuccess(publisher);
    this.handlePublisherError(publisher);
  }

  private emitPublisher(publisher) {
    this.publisherCreated.emit(publisher);
  }

  private handlePublisherSuccess(publisher: Publisher) {
    publisher.once('accessAllowed', async () => {
      if (this.oVDevicesService.areEmptyLabels()) {
        await this.oVDevicesService.initDevices();
        if (this.hasAudioDevices) {
          const audioLabel = publisher?.stream?.getMediaStream()?.getAudioTracks()[0]?.label;
          this.oVDevicesService.setMicSelected(audioLabel);
        }

        if (this.hasVideoDevices) {
          const videoLabel = publisher?.stream?.getMediaStream()?.getVideoTracks()[0]?.label;
          this.oVDevicesService.setCamSelected(videoLabel);
        }
        this.setDevicesInfo();
      }
      // Emit publisher to webcomponent and angular-library
      this.emitPublisher(publisher);

      if (this.ovSettings.isAutoPublish()) {
        this.joinSession();
        return;
      }
      this.showConfigCard = true;
    });
  }

  private handlePublisherError(publisher: Publisher) {
    publisher.once('accessDenied', (e: any) => {
      let message: string;
      if (e.name === OpenViduErrorName.DEVICE_ALREADY_IN_USE) {
        this.log.w('Video device already in use. Disabling video device...');
        // Allow access to the room with only mic if camera device is already in use
        this.hasVideoDevices = false;
        this.oVDevicesService.disableVideoDevices();
        return this.initwebcamPublisher();
      }
      if (e.name === OpenViduErrorName.DEVICE_ACCESS_DENIED) {
        message = 'Access to media devices was not allowed.';
      }
      else
        if (e.name === OpenViduErrorName.NO_INPUT_SOURCE_SET) {
          message = 'No video or audio devices have been found. Please, connect at least one.';
        }
      this.utilsSrv.showErrorMessage(e.name.replace(/_/g, ' '), message, true);
      this.log.e(e.message);
    });
  }
}
