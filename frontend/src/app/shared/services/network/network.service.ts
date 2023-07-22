import { Injectable, NgZone } from '@angular/core';
import { LoggerService } from '../logger/logger.service';
import { ILogger } from '../../types/logger-type';
import { throwError as observableThrowError } from 'rxjs/internal/observable/throwError';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/internal/operators/catchError';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenService } from '../token/token.service';
import { LocalUsersService } from '../local-users/local-users.service';
import { OpenViduWebrtcService } from '../openvidu-webrtc/openvidu-webrtc.service';
import { FirebaseService } from '../firebase.service';

@Injectable({ providedIn: 'root' })

export class NetworkService {
	private log: ILogger;
	private baseHref: string;
	public eventSource;
	constructor(private firebaseService: FirebaseService, private openViduWebRTCService: OpenViduWebrtcService, private localUsersService: LocalUsersService, private oHttpClient: HttpClient, private oLoggerService: LoggerService, private _zone: NgZone) {
		this.log = this.oLoggerService.get('NetworkService');
		this.baseHref = '/' + (!!window.location.pathname.split('/')[1] ? window.location.pathname.split('/')[1] + '/' : '');
	}
	getServerSentEvent = (url: string) => {
		try {
			return Observable.create(observer => {
				this.eventSource = this.getEventSource(url);
				this.eventSource.onmessage = event => {
					this._zone.run(() => {
						observer.next(event);
					});
				};
				interval(500)
					.subscribe(async (val) => {
						console.log('NetworkServce eventSource.readyState value which should be 0 ===> ', this.eventSource.readyState);
						if (this.eventSource.readyState == 2 || this.eventSource.readyState == 1) {
							this.NetworkService_subscribeToMuteEvent();
						}
					});
				this.eventSource.onerror = function (e) {
					console.log('Event Error: ', e.target.readyState);
				}
			});
		}
		catch (error) {
			if (this.eventSource) {
				this.eventSource.close();
			}
		}
	}
	ngOnDestroy() {
		if (this.eventSource) {
			this.eventSource.close();
		}
	}
	NetworkService_subscribeToMuteEvent() {
		if (this.eventSource) {
			this.eventSource.close();
		}
		this.getServerSentEvent(environment.NODE_BASE_URL + '/call/checkMuteAll').subscribe(data => {
			console.log('MuteAll Event value: ', JSON.parse(data.data));
			let mySessionID = sessionStorage.getItem('sessionId');
			let oIsMuted = JSON.parse(data.data).MuteValue;
			let sessionId = JSON.parse(data.data).sessionId;
			if (mySessionID == sessionId) {
				if (oIsMuted == 1) {
					if (this.localUsersService.isWebCamEnabled()) {
						this.openViduWebRTCService.publishWebcamAudio(false);
					}
					this.openViduWebRTCService.publishScreenAudio(false);
				}
				else {
					if (this.localUsersService.isWebCamEnabled()) {
						this.openViduWebRTCService.publishWebcamAudio(true);
					}
					this.openViduWebRTCService.publishScreenAudio(true);
				}
			}
		});
	}
	private getEventSource(url: string): EventSource {
		return new EventSource(url);
	}
	async getToken(session: string, sEmail: string, openviduServerUrl: string, openviduSecret: string): Promise<string> {
		if (!!openviduServerUrl && !!openviduSecret) {
			const _sessionId = await this.createSession(session, openviduServerUrl, openviduSecret);
			return await this.createToken(_sessionId, openviduServerUrl, openviduSecret);
		}
		try {
			this.log.d('Getting token from backend');
			return await this.oHttpClient.post<any>(this.baseHref + 'call/create_subscriber', { sessionId: session, email: sEmail }).toPromise();
		}
		catch (error) {
			if (error.status === 404) {
				throw { status: error.status, message: 'Cannot connect with backend. ' + error.url + ' not found' };
			}
			throw error;
		}
	}
	async NetworkService_CheckIsAlive(session: string): Promise<string> {

		console.log('this.baseHref ', this.baseHref);
		try {
			this.log.d('Getting token from backend');
			return await this.oHttpClient.post<any>(this.baseHref + 'call/checkAlive', { sessionId: session }).toPromise();
		}
		catch (error) {
			if (error.status === 404) {
				throw { status: error.status, message: 'Cannot connect with backend. ' + error.url + ' not found' };
			}
			throw error;
		}
	}
	async NetworkService_CheckSessionID(session: string): Promise<string> {

		console.log('this.baseHref ', this.baseHref);
		try {
			this.log.d('Getting token from backend');
			return await this.oHttpClient.post<any>(this.baseHref + 'call/checkSessionId', { sessionId: session }).toPromise();
		}
		catch (error) {
			if (error.status === 404) {
				throw { status: error.status, message: 'Cannot connect with backend. ' + error.url + ' not found' };
			}
			throw error;
		}
	}
	async NetworkService_GetUserRole(sSession: string, sEmail: string): Promise<string> {
		try {
			return await this.oHttpClient.post<any>(this.baseHref + 'call/userRole', { sessionId: sSession, email: sEmail }).toPromise();
		}
		catch (error) {
			if (error.status === 404) {
				throw { status: error.status, message: 'Cannot connect with backend. ' + error.url + ' not found' };
			}
			throw error;
		}
	}
	async NetworkService_MuteAll(sSession: string, bMuteValue: number) {
		this.firebaseService.muteSession(bMuteValue);
		try {
			return await this.oHttpClient.post<any>(this.baseHref + 'call/MuteAll', { sessionId: sSession, muteValue: bMuteValue }).toPromise();
		}
		catch (error) {
			if (error.status === 404) {
				throw { status: error.status, message: 'Cannot connect with backend. ' + error.url + ' not found' };
			}
			throw error;
		}
	}
	async NetworkService_IsMuteAll(sSession: string): Promise<string> {
		try {

			return await this.oHttpClient.post<any>(this.baseHref + 'call/checkIsMuteAll', { sessionId: sSession }).toPromise();
		}
		catch (error) {
			if (error.status === 404) {
				throw { status: error.status, message: 'Cannot connect with backend. ' + error.url + ' not found' };
			}
			throw error;
		}
	}
	async NetworkService_LockMeeting(sSession: string, nLockValue: number): Promise<string> {
		try {

			return await this.oHttpClient.post<any>(this.baseHref + 'call/LockSession', { sessionId: sSession, nLockValue: nLockValue }).toPromise();
		}
		catch (error) {
			if (error.status === 404) {
				throw { status: error.status, message: 'Cannot connect with backend. ' + error.url + ' not found' };
			}
			throw error;
		}
	}

	createSession(sessionId: string, openviduServerUrl: string, openviduSecret: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const body = JSON.stringify({ customSessionId: sessionId });
			const options = { headers: new HttpHeaders({ Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + openviduSecret), 'Content-Type': 'application/json' }) };
			return this.oHttpClient.post<any>(openviduServerUrl + '/api/sessions', body, options).pipe(catchError(error => {
				if (error.status === 409) {
					resolve(sessionId);
				}
				if (error.statusText === 'Unknown Error') {
					reject({ status: 401, message: 'ERR_CERT_AUTHORITY_INVALID' });
				}
				return observableThrowError(error);
			})).subscribe(response => {
				resolve(response.id);
			});
		});
	}
	createToken(sessionId: string, openviduServerUrl: string, openviduSecret: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const body = JSON.stringify({ session: sessionId });
			const options = { headers: new HttpHeaders({ Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + openviduSecret), 'Content-Type': 'application/json' }) };
			return this.oHttpClient.post<any>(openviduServerUrl + '/api/tokens', body, options).pipe(catchError(error => {
				reject(error);
				return observableThrowError(error);
			})).subscribe(response => {
				this.log.d(response);
				resolve(response.token);
			});
		});
	}

	async startRecording(sessionId: string, openviduServerUrl: string, openviduSecret: string): Promise<string> {
		try {
			this.log.d('Start recording');
			return await this.oHttpClient.post<any>(this.baseHref + 'call/start', { sessionId }).toPromise();
		}
		catch (error) {
			if (error.status === 404) {
				throw { status: error.status, message: 'Cannot connect with backend. ' + error.url + ' not found' };
			}
			throw error;
		}
	}

	async stopRecording(id: string, emailId: string): Promise<string> {
		try {
			this.log.d('Start recording');
			return await this.oHttpClient.post<any>(this.baseHref + 'call/stop', { id, emailId }).toPromise();

		}
		catch (error) {
			if (error.status === 404) {
				throw { status: error.status, message: 'Cannot connect with backend. ' + error.url + ' not found' };
			}
			throw error;
		}
	}

	async Network_SendEmail(sessionId: string, emailId: string): Promise<string> {

		try {
			return await this.oHttpClient.post<any>(this.baseHref + 'call/sendEmail', { sessionId, emailId }).toPromise();
		}
		catch (oError) {
			this.log.d('Cannot connect ' + oError.url);
			this.log.d(oError);
		}
	}
	async Network_CallCreate(email: string): Promise<string> {

		try {
			return await this.oHttpClient.post<any>(this.baseHref + 'call/create', { email }).toPromise();
		}
		catch (oError) {
			this.log.d('Cannot connect ' + oError.url);
			this.log.d(oError);
		}
	}

	async Network_CallActiveSessions(): Promise<string> {

		try {
			return await this.oHttpClient.get<any>(this.baseHref + 'call/ActiveSessions').toPromise();
		}
		catch (oError) {
			this.log.d('Cannot connect ' + oError.url);
			this.log.d(oError);
		}
	}
}