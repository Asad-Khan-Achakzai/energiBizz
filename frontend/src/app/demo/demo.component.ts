import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { keyframes } from '@angular/animations';
import { environment } from '../../environments/environment';
import * as bcrypt from 'bcryptjs';
import { interval } from 'rxjs';
import { LoggerService } from '../shared/services/logger/logger.service';
import { AngularFirestore } from "@angular/fire/firestore";
import { FirebaseService } from '../shared/services/firebase.service';
@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css']
})
export class DemoComponent implements OnInit {
  Form: FormGroup;
  getAllSessionsResponse;
  link;
  sEnergiBizzPass: any;
  showSecretKeyCol = true;
  getAllSessionsKey = '';
  myArray: any;
  id: string;
  constructor(private oFormBuilder: FormBuilder,private firebaseService:FirebaseService, private firestore: AngularFirestore,private oHttpClient: HttpClient, private router: Router,private loggerService:LoggerService) { }

  ngOnInit(): void { 
    this.Form = this.oFormBuilder.group(
      {
          email: ['', [Validators.maxLength(25), Validators.required]],
          pass: ['', [Validators.required]],
          passCode: ['', [Validators.required,Validators.minLength(6)]],
      });
    this.showSecretKeyCol = true;
    interval(environment.keepAliveInterval)
    .subscribe(async (val) => {
      let oResponse: any = await this.DemoComponent_IsAlive();
      if(!oResponse.Data){
        alert('Database is down');
      }else{
        console.log('oResponse of server Health =',oResponse);
      }
    });
  }
  async Home_GetNavigationLink(){
    this.sEnergiBizzPass = bcrypt.hashSync(this.Form.controls['pass'].value, 10);
    let data =  await this.oHttpClient.post<any>(environment.NODE_BASE_URL + "/call/create" , { email:this.Form.controls['email'].value,key: this.sEnergiBizzPass,passCode: this.Form.controls['passCode'].value}).toPromise();
    this.showSecretKeyCol = false;
    this.firebaseService.initiateSessionValues(data.sessionId);
    this.link = data.data;
    //  document.location.href = data.data;

  }
  async Home_GetAllSessions(){
    this.sEnergiBizzPass = bcrypt.hashSync(this.getAllSessionsKey,10);
    let data = await this.oHttpClient.post<any>(environment.NODE_BASE_URL + "/call/ActiveSessions", {key: this.sEnergiBizzPass }).toPromise(); 
    this.getAllSessionsResponse = JSON.stringify(data) ;
  }
  async DemoComponent_IsAlive(): Promise<string> {
		try {
			return await this.oHttpClient.get<any>(environment.NODE_BASE_URL + '/call/IsAlive').toPromise();
		}
		catch (error) {
			if (error) {
        alert('Server is down');
        return error.message;
			}
		}
	}
}
