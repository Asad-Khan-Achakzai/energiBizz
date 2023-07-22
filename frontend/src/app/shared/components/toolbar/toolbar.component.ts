import { Component, OnInit, Input, EventEmitter, Output, HostListener, OnDestroy } from '@angular/core';
import { UtilsService } from '../../services/utils/utils.service';
import { VideoFullscreenIcon } from '../../types/icon-type';
import { OvSettingsModel } from '../../models/ovSettings';
import { ChatService } from '../../services/chat/chat.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { TokenService } from '../../services/token/token.service';
import { LocalUsersService } from '../../services/local-users/local-users.service';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';
import { NetworkService } from '../../services/network/network.service';
import { UserName } from '../../types/username-type';
import { VideoType } from '../../types/video-type';
//import { ParticipantsComponent } from '../participants/participants.component';

@Component({
	selector: 'app-toolbar',
	templateUrl: './toolbar.component.html',
	styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit, OnDestroy {
	@Input() lightTheme: boolean;
	
	participantsNames: string[] = [];

	// @Input()
	// set participants(participants: UserName[]) {
	// 	this.participantsNames = [];
	// 	participants.forEach((names) => {
	// 		if (!names.nickname.includes(VideoType.SCREEN)) {
	// 			this.participantsNames.push(names.nickname);
	// 		}
	// 	});
	// 	this.participantsNames = [...this.participantsNames];
	// }
	@Input() compact: boolean;
	@Input() showNotification: boolean;
	@Input() ovSettings: OvSettingsModel;

	@Input() isWebcamAudioEnabled: boolean;
	@Input() isAutoLayout: boolean;
	@Input() isConnectionLost: boolean;
	@Input() hasVideoDevices: boolean;
	@Input() hasAudioDevices: boolean;
	@Input() showPlayBtn: boolean;
	@Input() isWebcamAudioEnabledAll: boolean;
	
	@Output() micAllButtonClicked = new EventEmitter<any>();

	@Output() micButtonClicked = new EventEmitter<any>();
	@Output() camButtonClicked = new EventEmitter<any>();
	@Output() screenShareClicked = new EventEmitter<any>();
	@Output() layoutButtonClicked = new EventEmitter<any>();
	@Output() leaveSessionButtonClicked = new EventEmitter<any>();

	@Output() startRecordingButtonClicked = new EventEmitter<any>();
	@Output() stopRecordingButtonClicked = new EventEmitter<any>();

	mySessionId: string;
	currenturl: string;
	newMessagesNum: number;
	isScreenShareEnabled: boolean;
	isWebcamVideoEnabled: boolean;
	public href: string = "";
	fullscreenIcon = VideoFullscreenIcon.BIG;
	logoUrl = 'assets/images/logo.png';

	// participantsNames: string[] = [];

	private chatServiceSubscription: Subscription;
	private screenShareStateSubscription: Subscription;
	private webcamVideoStateSubscription: Subscription;
	isShowRecord: boolean;
	route: string;
	bIsSessionLocked = true;
	nMuteAllTimer: any;
	//participantlist;
	//participants = false;

	constructor(
		location: Location,
		private utilsSrv: UtilsService,
		private chatService: ChatService,
		private clipboard: Clipboard,
		private router: Router,
		public tokenService: TokenService,
		activatedRoute: ActivatedRoute,
		private localUsersService: LocalUsersService,
		private oNetworkService: NetworkService,

	) {


		// console.log(activatedRoute.snapshot['_routerState'].url); 
	}

	ngOnDestroy(): void {
		if (this.chatServiceSubscription) {
			this.chatServiceSubscription.unsubscribe();
		}
		if (this.screenShareStateSubscription) {
			this.screenShareStateSubscription.unsubscribe();
		}
		if (this.webcamVideoStateSubscription) {
			this.webcamVideoStateSubscription.unsubscribe();
		}
	}

	@HostListener('window:resize', ['$event'])
	sizeChange(event) {
		const maxHeight = window.screen.height;
		const maxWidth = window.screen.width;
		const curHeight = window.innerHeight;
		const curWidth = window.innerWidth;
		if (maxWidth !== curWidth && maxHeight !== curHeight) {
			this.fullscreenIcon = VideoFullscreenIcon.BIG;
		}
	}

	ngOnInit() {

		// this.href = this.router.url;
		// console.log(this.href);
		this.isWebcamAudioEnabledAll = false;
		console.log(this.router.url);
		this.currenturl = window.location.href;
		if (sessionStorage.getItem("isShowRecord") == 'true') {
			console.log('it is true')
			this.isShowRecord = true;
		}
		else {
			console.log('it is false')
			this.isShowRecord = false;
		}
		this.isWebcamAudioEnabledAll = JSON.parse(sessionStorage.getItem('isMuteAll'));
		this.mySessionId = this.tokenService.getSessionId();

		this.chatServiceSubscription = this.chatService.messagesUnreadObs.subscribe((num) => {
			this.newMessagesNum = num;
		});

		this.screenShareStateSubscription = this.localUsersService.screenShareState.subscribe((enabled) => {
			this.isScreenShareEnabled = enabled;
		});

		this.webcamVideoStateSubscription = this.localUsersService.webcamVideoActive.subscribe((enabled) => {
			this.isWebcamVideoEnabled = enabled;
		});
		if (this.lightTheme) {
			this.logoUrl = 'assets/images/EnergiBizz_logo_grey.png';
		}
	}
	Toolbar_Participant()
	{
		//this.participants = !this.participants;
		//this.participantlist = this.tokenService.aParticipantsList;
		this.chatService.toggleParticipants();

	}
	
	getsessionid() {
		this.clipboard.copy(this.currenturl);
	}
	

	toggleMicrophone() {
		this.localUsersService.LocalUserService_MuteUserHimSelf(this.isWebcamAudioEnabled);
		this.micButtonClicked.emit();
	}
	Toolbar_toggleMicrophoneAll() {
		if(!this.nMuteAllTimer){
			this.micAllButtonClicked.emit();

			if (this.isWebcamAudioEnabledAll) {
				this.isWebcamAudioEnabledAll = false;
			}
			else {
				this.isWebcamAudioEnabledAll = true;
			}
			this.nMuteAllTimer = 'muteAll clicked'
			setTimeout (() => {
				this.nMuteAllTimer = null;
			 }, 1000);
		}
	}
	async Toolbar_LockMeeting() {
		let nLockValue;
		if (this.bIsSessionLocked) {
			nLockValue = 1;
			let sSessionID = this.tokenService.getSessionId();
			let oResponse: any = await this.oNetworkService.NetworkService_LockMeeting(sSessionID, nLockValue);
			if (oResponse.Message == 'Session isLocked updated') {
				this.bIsSessionLocked = false;
			}
			else {
				alert('session is not locked');
			}
		}
		else {
			nLockValue = 0;
			let sSessionID = this.tokenService.getSessionId();
			let oResponse: any = await this.oNetworkService.NetworkService_LockMeeting(sSessionID, nLockValue);
			if (oResponse.Message == 'Session isLocked updated') {
				this.bIsSessionLocked = true;
			}
			else {
				alert('session is not unLocked');
			}
		}


	}
	toggleCamera() {
		this.camButtonClicked.emit();
	}

	toggleSpeakerLayout() {
		this.layoutButtonClicked.emit();
	}

	leaveSession() {

		this.leaveSessionButtonClicked.emit();
	}
	startRecording() {
		this.startRecordingButtonClicked.emit();
	}
	stopRecording() {
		this.stopRecordingButtonClicked.emit();
	}


	toggleChat() {
		this.chatService.toggleChat();
	}

	toggleFullscreen() {
		this.utilsSrv.toggleFullscreen('videoRoomNavBar');
		this.fullscreenIcon = this.fullscreenIcon === VideoFullscreenIcon.BIG ? VideoFullscreenIcon.NORMAL : VideoFullscreenIcon.BIG;
	}
	toggleScreenShare() {
		this.screenShareClicked.emit();
	}
}
