import { Injectable } from '@angular/core';
import { ILogger } from '../../types/logger-type';
import { LoggerService } from '../logger/logger.service';
import { NetworkService } from '../network/network.service';
import { ExternalConfigModel } from '../../models/external-config';
import { OvSettingsModel } from '../../models/ovSettings';

@Injectable({
	providedIn: 'root'
})
export class TokenService {
	private webcamToken = '';
	private screenToken = '';
	private sessionId = '';
	private ovSettings: OvSettingsModel;
	private log: ILogger;
	private sEmail: string;
	public aParticipantsList:string[];

	constructor(private loggerSrv: LoggerService, private networkSrv: NetworkService) {
		this.log = this.loggerSrv.get('TokenService');
	}
Token_AddParticipant(sParticipant){
	
	this.aParticipantsList = sParticipant;
	console.log('aParticipantsList = ',this.aParticipantsList);
}
	initialize(ovSettings: OvSettingsModel) {
		this.ovSettings = ovSettings;
	}

	setSessionId(sessionId: string) {
		this.sessionId = sessionId;
	}

	getSessionId(): string {
		return this.sessionId;
	}

	Token_SetEmail(email: string) {
		this.sEmail = email;
	}

	Token_GetEmail(): string {
		return this.sEmail;
	}

	async initTokens(externalConfig: ExternalConfigModel) {
		// WebComponent or Angular library
		if (!!externalConfig && externalConfig.hasTokens()) {
			this.log.d('Received external tokens from ' + externalConfig.getComponentName());
			this.webcamToken = externalConfig.getWebcamToken();
			// Only connect screen if screen sharing feature is available
			this.screenToken = this.ovSettings?.hasScreenSharing() ? externalConfig.getScreenToken() : undefined;
			return;
		}
		this.log.d('No external tokens received. Generating token...');
		await this.generateWebcamToken(this.sessionId,this.sEmail, externalConfig?.getOvServerUrl(), externalConfig?.getOvSecret());
		// TODO: create screenToken only when user initialize the screen
		if (this.ovSettings?.hasScreenSharing()) {
			await this.generateScreenToken(this.sessionId,this.sEmail, externalConfig?.getOvServerUrl(), externalConfig?.getOvSecret());
		}
	}

	getWebcamToken(): string {
		return this.webcamToken;
	}

	getScreenToken(): string {
		return this.screenToken;
	}

	private async generateWebcamToken(sessionId: string,sEmail: string, ovUrl: string, ovSecret: string) {
		this.log.d('Generating webcam token...');
		this.webcamToken = await this.networkSrv.getToken(sessionId,sEmail, ovUrl, ovSecret);
	}

	private async generateScreenToken(sessionId: string,sEmail: string, ovUrl: string, ovSecret: string) {
		this.log.d('Generating screen token...');
		this.screenToken = await this.networkSrv.getToken(sessionId,sEmail, ovUrl, ovSecret);
	}
}
