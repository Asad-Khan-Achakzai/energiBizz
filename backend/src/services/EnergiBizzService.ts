import { HttpClientService } from './HttpClientService';
import { ENERGIBIZZ_URL, ENERGIBIZZ_SECRET } from '../config';



export class EnergiBizzService {

    private httpClientService: HttpClientService;


	constructor(){
        this.httpClientService = new HttpClientService();
    }

	public async createSession(sessionId: string, energiBizzUrl: string, energiBizzSecret: string ): Promise<any> {
        const url = energiBizzUrl + '/api/sessions';
        console.log("Requesting session to ", url);
        const body: string = JSON.stringify({ customSessionId: sessionId});

        return await this.httpClientService.post(body, url, energiBizzSecret);
	}
    public async EnergyBizzService_GetActiveSession(sessionId: string, energiBizzUrl: string, energiBizzSecret: string ): Promise<any> {
        const url = energiBizzUrl + '/api/sessions/'+sessionId;
        console.log("Requesting session to ", url);
        return await this.httpClientService.get( url, energiBizzSecret);
    }
    public async EnergyBizzService_GetAllActiveSession( energiBizzUrl: string, energiBizzSecret: string ): Promise<any> {
        const url = energiBizzUrl + '/api/sessions';
        return await this.httpClientService.get( url, energiBizzSecret);
	}
	public async createToken(sessionId: string, energiBizzUrl: string, energiBizzSecret: string ): Promise<any> {
		const url = energiBizzUrl + '/api/tokens';
        console.log("Requesting token to ", url);
        const body: string = JSON.stringify({ session: sessionId });

        return await this.httpClientService.post(body, url, energiBizzSecret);
    }
    public async createTokenForSubsciriber(sessionId: string, energiBizzUrl: string, energiBizzSecret: string ): Promise<any> {
		const url = energiBizzUrl + '/api/tokens';
        console.log("Requesting token to ", url);
        const body: string = JSON.stringify({ session: sessionId,role: 'MODERATOR' });

        return await this.httpClientService.post(body, url, energiBizzSecret);
    }


    public async startRecording(sessionId: string, energiBizzUrl: string, energiBizzSecret: string ): Promise<any> {
		const url = energiBizzUrl + '/api/recordings/start';
        console.log("Start recording to ", url);
        const body: string = JSON.stringify({ session: sessionId });

        return await this.httpClientService.post(body, url, energiBizzSecret);
    }



    public async stopRecording(id: string, energiBizzUrl: string, energiBizzSecret: string ): Promise<any> {
		const url = energiBizzUrl + '/api/recordings/stop/'+id;
        console.log("stop recording to", url);
        const body: string = '';

        return await this.httpClientService.post(body, url, energiBizzSecret);
    }

    public async getRecording(id: string, energiBizzUrl: string, energiBizzSecret: string ): Promise<any> {
		const url = energiBizzUrl + '/api/recordings/'+id;
        console.log("get recording to", url);
        const body: string = '';

        return await this.httpClientService.get( url, energiBizzSecret);
    }

    public async sessions (sessionId: string, energiBizzUrl: string, energiBizzSecret: string ): Promise<any> {
		const url = energiBizzUrl + '/api/sessions'+sessionId;
        console.log("stop recording to", url);
        
        return await this.httpClientService.get(url, energiBizzSecret);
    }


    public async Network_StartTranscribe(id: string)
    {
            const headers = {'Accept': 'application/json', Authorization: 'Bearer d533#4491e@aB02a*'};
        //const url = environment.API_HOST +'transcribe?session='+id;
        const url = 'https://35.225.227.44:5005/'+'transcribe';
        const body: string = JSON.stringify({ });
  
        let params = {'session':id };
  
            try
        {
                console.log('Start transcription');
                return  this.httpClientService.postfile(`${body}`,url, params)
            }
        catch (oError)
        {
          console.log('Cannot connect ' + oError.url);
          console.log(oError);
        }
      }
    public async transcribeFileStatus(sessionId: string,taskId:string) : Promise<any> {

        
        if(!sessionId)
        {
        setTimeout(()=> { 
            
            this.transcribeFileStatus(sessionId,taskId);
        }, 5*1000);
    }
    else
    {
        const fileStatusResponse = await this.Network_TranscribeFileStatus(taskId);
        const status = fileStatusResponse['status']
     
        console.log('Status  => ', status);
    
        if(status =='running'){
            
             
             setTimeout(()=> { 
                this.transcribeFileStatus(sessionId,taskId);
            }, 5*1000);
        }
        else{
            
            console.log('Get Transcribe file => ',status);
            return await this.Network_GetFile(sessionId);
            
            
            
        } 
    }
    }


    async Network_TranscribeFileStatus(taskId: string )
	{
			const headers = {'Accept': 'application/json', Authorization: 'Bearer d533#4491e@aB02a*'};
		//const url = environment.API_HOST +'transcribe?session='+id;
		const url = 'https://35.225.227.44:5005/'+'get_task_status';
  
  
			try
		{
                const params={'taskid': taskId};
			
				console.log('Start TranscribeFileStatus');
		        return await this.httpClientService.getfile(url,params);
			}
		catch (oError)
		{
			console.log('Cannot connect ' + oError.url);
		    console.log(oError);
		}
      }
      

      Network_GetFile(sessionId: string) : any
      {
          //debugger;
              const headers = {'Accept': 'application/json', Authorization: 'Bearer d533#4491e@aB02a*'};
          //const url = environment.API_HOST +'transcribe?session='+id;
          const url = 'https://35.225.227.44:5005/'+'get_file';
    
          //debugger;
              try
          {
            const params = {'session': sessionId, 'filename': sessionId+'.txt'} ;
            console.log('Start GetFile');
            return  this.httpClientService.getfile(url,params);
              }
          catch (oError)
          {
            console.log('Cannot connect ' + oError.url);
            console.log(oError);
          }
        }



  

}