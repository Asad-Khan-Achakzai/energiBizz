import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { LocalUsersService } from './local-users/local-users.service';
import { OpenViduWebrtcService } from './openvidu-webrtc/openvidu-webrtc.service';
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  id: any;
  userCollection: any;
  collection: any;
  MuteResponse: any;

  constructor(private localUsersService: LocalUsersService, private openViduWebRTCService: OpenViduWebrtcService, private firestore: AngularFirestore) { }

  initiateSessionValues(sessioId) {
    this.firestore.collection('MuteAllValues').add({
      MuteAll: 0, SessionId: sessioId
    }).then(res => {
      let documentId = res.id;
      localStorage.setItem('documentId', JSON.stringify(documentId));
    }).catch(e => {
      console.log(e);
    });
  }
  async muteSession(muteValue) {
    let mySessionID = sessionStorage.getItem('sessionId');
    let documentId;
    let valueAssigned = false;
    const docRef = await this.firestore.collection('MuteAllValues', ref => ref.where("SessionId", "==", mySessionID));
    docRef.snapshotChanges().forEach((changes) => {
      changes.map((a) => {
        documentId = a.payload.doc.id;
        if (!valueAssigned) {
          this.firestore.collection('MuteAllValues').doc(documentId).update({ MuteAll: muteValue });
          valueAssigned = true;
        }
      });
    });
  }
  getDocument() {
    let oIsMuted;
    let mySessionID = sessionStorage.getItem('sessionId');
    const docRef = this.firestore.collection('MuteAllValues', ref => ref.where("SessionId", "==", mySessionID));
    docRef.snapshotChanges().forEach((changes) => {
      changes.map((a) => {
        this.MuteResponse = a.payload.doc.data();
        oIsMuted = this.MuteResponse.MuteAll;
        if (oIsMuted == 1) {
          if (this.localUsersService.isWebCamEnabled()) {
            this.openViduWebRTCService.publishWebcamAudio(false);
          }
          this.openViduWebRTCService.publishScreenAudio(false);
        }
        else {
          let userMuteHimSelf = JSON.parse(sessionStorage.getItem('userMuteedHimself'));
          if (!userMuteHimSelf) {
            if (this.localUsersService.isWebCamEnabled()) {
              this.openViduWebRTCService.publishWebcamAudio(true);
            }
            this.openViduWebRTCService.publishScreenAudio(true);
          }
        }
      });
    });
  }
}
