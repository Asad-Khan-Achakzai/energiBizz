import axios, { AxiosRequestConfig } from 'axios';
import * as https from 'https';
var btoa = require('btoa');
import { CALL_ENERGIBIZZ_CERTTYPE } from '../config';

export class HttpClientService {

	private options: AxiosRequestConfig = {};

	constructor(){}

	public async post(body: string, energiBizzUrl: string, energiBizzSecret: string): Promise<any> {

		if(CALL_ENERGIBIZZ_CERTTYPE === 'selfsigned'){
			this.options.httpsAgent = new https.Agent({
				rejectUnauthorized: false
			});
		}

		this.options.headers = {
			Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + energiBizzSecret),
			'Content-Type': 'application/json',
		};

		try {
			const response = await axios.post<any>(energiBizzUrl, body, this.options);
			console.log("Response ", response.data);
			return response.data;
		} catch (error) {
			throw error;
		}
	}
	

	public async get(energiBizzUrl: string, energiBizzSecret: string): Promise<any> {

		if(CALL_ENERGIBIZZ_CERTTYPE === 'selfsigned'){
			this.options.httpsAgent = new https.Agent({
				rejectUnauthorized: false
			});
		}

		this.options.headers = {
			Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + energiBizzSecret),
			'Content-Type': 'application/json',
		};
		

		try {
			const response = await axios.get<any>(energiBizzUrl, this.options);
			console.log("Response ", response.data);
			return response.data;
		} catch (error) {
			throw error;
		}
	}



	public async getfile(energiBizzUrl: string, params:any): Promise<any> {

		if(CALL_ENERGIBIZZ_CERTTYPE === 'selfsigned'){
			this.options.httpsAgent = new https.Agent({
				rejectUnauthorized: false
			});
		}

		this.options.headers = {'Accept': 'application/json', Authorization: 'Bearer d533#4491e@aB02a*'};
		this.options.params= params;
		

		try {
			const response = await axios.get<any>(energiBizzUrl, this.options);
			console.log("Response ", response.data);
			return response;
		} catch (error) {
			throw error;
		}
	}

	

	public async postfile(body: string, energiBizzUrl: string, params:any): Promise<any> {

		if(CALL_ENERGIBIZZ_CERTTYPE === 'selfsigned'){
			this.options.httpsAgent = new https.Agent({
				rejectUnauthorized: false
			});
		}

		this.options.headers = {'Accept': 'application/json', Authorization: 'Bearer d533#4491e@aB02a*'};
		this.options.params= params;

		try {
			const response = await axios.post<any>(energiBizzUrl, body, this.options);
			console.log("Response ", response.data);
			return response.data;
		} catch (error) {
			throw error;
		}
	}
	
}