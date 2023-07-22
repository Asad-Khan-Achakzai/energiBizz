import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable(
{
  providedIn: 'root'
})

export class DataService
{
  public static startTranscription : string = `${environment.API_HOST}transcribe`;

public static getTranscribeFile : string = `${environment.API_HOST}get_file`;
  constructor() { }

 
  
  
}