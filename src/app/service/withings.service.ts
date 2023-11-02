import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {JwtHelperService} from '@auth0/angular-jwt';
import {EPRService} from "./epr.service";
import {DatePipe} from '@angular/common';
import {StravaService} from "./strava.service";
import {MeasuresDay} from "../models/measures-day";

@Injectable({
  providedIn: 'root'
})
export class WithingsService {

  private accessToken = undefined;

  private refreshingToken = false;

  url = 'https://wbsapi.withings.net';
  private redirect: string | undefined;
  constructor(private http: HttpClient,
              private epr: EPRService,
              private strava: StravaService,
              private datePipe: DatePipe) { }


  tokenChange: EventEmitter<any> = new EventEmitter();

  sleepMeasures: EventEmitter<MeasuresDay> = new EventEmitter();



  getSleep(): void {
    console.log('getSleep')
    if (!this.hasAccessToken()) { return; }
    console.log('withings has access token')

    this.getAPISleepSummary().subscribe((sleepData) => {
          if (sleepData.status === 401) {
            console.log('Withings 401', sleepData);
            this.deleteAccessToken();
          }
          else if (sleepData.status === 403) {
            console.log('Withings 403 - Need to ask for permission', sleepData);

          } else {
            for (const sleep of sleepData.body.series) {
              this.getAPISleepGet(sleep.startdate, sleep.enddate).subscribe(sleepDetail => {
                const enddate = new Date(sleep.enddate * 1000);
                const startdate = new Date(sleep.startdate * 1000);
                let count = 0;
                let hrvSum = 0;
                if (sleepDetail.body !== undefined && sleepDetail.body.series !== undefined) {
                  for (const sleep of sleepDetail.body.series) {
                    if (sleep.sdnn_1 !== undefined) {
                      Object.entries(sleep.sdnn_1).forEach(([key, value]) => {
                        // @ts-ignore
                        if (value > 0) {
                          count++;
                          hrvSum += Number(value as string);
                        }
                      });
                    }
                  }
                  let measureDay: MeasuresDay = {
                    day: startdate,
                    hrv: hrvSum/count,
                    sleepScore: sleep.data.sleep_score,
                    hr_average: sleep.data.hr_average
                  }
                  this.sleepMeasures.emit(measureDay)
                }
              });
            }
          }
        },
        (err:any) => {
          console.log(err);
          if (err.status === 401) {

          }
        }
    );
  }


  /* **********************
     EXTERNAL API CALLS
  ********************   */



  private getAPISleepGet(start: number, end: number): Observable<any> {

    // This is just a 24 hour window
    const headers = this.getAPIHeaders();

    // https://developer.withings.com/api-reference/#tag/sleep/operation/sleepv2-get
    const hrv = 'action=get'
        + '&startdate=' + start
        + '&enddate=' + + end
        + '&data_fields=sdnn_1,rmssd';

    return this.http.post<any>(this.url + '/v2/sleep', hrv, { headers} );

  }


  private getAPISleepSummary(): Observable<any> {

    const headers = this.getAPIHeaders();

    // https://developer.withings.com/api-reference/#tag/sleep/operation/sleepv2-getsummary

    const bodge = 'action=getsummary'
        + '&startdateymd=' + this.datePipe.transform(this.strava.getFromDate(), 'yyyy-MM-dd')
        + '&enddateymd=' + this.datePipe.transform(this.strava.getNextToDay(), 'yyyy-MM-dd')
        + '&data_fields=breathing_disturbances_intensity,deepsleepduration,lightsleepduration'
        + ',wakeupcount,durationtosleep,sleep_score,remsleepduration'
        + ',snoring,rr_average,hr_average,hr_min,apnea_hypopnea_index';

    return this.http.post<any>(this.url + '/v2/sleep', bodge, { headers} );

  }




  public authorise(routeUrl: string): void {
    if (routeUrl.substring(routeUrl.length - 1, 1) === '/') {
      routeUrl = routeUrl.substring(0, routeUrl.length - 1);
    }
    this.redirect = routeUrl;
    localStorage.setItem('appRoute', routeUrl);
    window.location.href = 'https://account.withings.com/oauth2_user/authorize2?response_type=code&client_id='
        + environment.withingClientId
        + '&redirect_uri=' + routeUrl
        + '&state=withings'
        + '&scope=user.metrics,user.activity';
  }



  initToken(): void {
    const token = this.getAccessToken();
    if (token !== undefined) { this.tokenChange.emit(token); }

  }


  getAccessToken(): string | undefined {
  //  console.log('Get Access token');
    if (localStorage.getItem('withingsToken') !== undefined) {
      // @ts-ignore
      const token: any = JSON.parse(localStorage.getItem('withingsToken'));

      const helper = new JwtHelperService();

      /*
      disabled 6 Mar 2023
      if (this.isTokenExpired(token.body)) {

        console.log('withings Token expired');
        this.accessToken = undefined;
        this.getRefreshToken();
        return undefined;
      } */
      if (token !== undefined) {
        this.accessToken = token.body.access_token;
        // @ts-ignore
        return this.accessToken;
      }
    }
    return undefined;
  }

/*
  public getRefreshToken(): string {
    console.log('refreshing token NOT YET IMPLEMENTED');

    if (this.refreshingToken) { return; }
    this.refreshingToken = true;



    const token: any = JSON.parse(localStorage.getItem('withingsToken'));

    const url = 'https://wbsapi.withings.net/v2/oauth2';


    const bodge = 'action=requesttoken'
      + 'grant_type=refresh_token'
      + '&client_id=' + environment.withingClientId
      + '&client_secret=' + environment.withingSecret
      + '&refresh_token=' + token.refresh_token;

    this.http.post<any>(url, bodge, { headers : {}} ).subscribe(
        accesstoken => {
          console.log('Withings refreshed token');
          this.setAccessToken(accesstoken);
          this.refreshingToken = false;
        },
        (err) => {
          console.log(err);
        }
    );
  }
*/


  public getOAuth2AccessToken(authorisationCode: string, routeUrl: string): void {


    // https://developer.withings.com/api-reference/#tag/oauth2/operation/oauth2-getaccesstoken

    const headers = {};

    const url = 'https://wbsapi.withings.net/v2/oauth2';

    const bodge = 'action=requesttoken'
        + '&grant_type=authorization_code'
        + '&client_id=' + environment.withingClientId
        + '&client_secret=' + environment.withingSecret
        + '&redirect_uri=' + routeUrl
        + '&code=' + authorisationCode;



    this.http.post<any>(url, bodge, { headers} ).subscribe(
        token => {
          console.log('withings Access Token');
          this.setAccessToken(token);
        },
        (err) => {
          console.log(err);
        }
    );
  }

  private hasAccessToken(): boolean {

    if (this.accessToken !== undefined) { return true; }
    this.getAccessToken();
    if (this.accessToken !== undefined) { return true; }
    console.log('No withing token found');
    return false;
  }


  private deleteAccessToken(): void {
    this.accessToken = undefined;
    localStorage.removeItem('withingsToken');
  }

  private getTokenExpirationDate(
      decoded: any
  ): Date | null {

    if (!decoded || !decoded.hasOwnProperty('expires_at')) {
      // Invalid format
      localStorage.removeItem('withingsToken');
      return null;
    }

    const date = new Date(0);
    date.setUTCSeconds(decoded.expires_at);

    return date;
  }

  private isTokenExpired(
      token: any,
      offsetSeconds?: number
  ): boolean {
    if (!token || token === '') {
      return true;
    }
    const date = this.getTokenExpirationDate(token);
    offsetSeconds = offsetSeconds || 0;


    if (date === null) {
      return false;
    }

    return !(date.valueOf() > new Date().valueOf() + offsetSeconds * 1000);
  }




  getAPIHeaders(): HttpHeaders {

    let headers = new HttpHeaders(
    );

    headers = headers.append('Authorization', 'Bearer ' + this.getAccessToken());
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    return headers;
  }

  /*
  User needs to login in order for this to work
  getOAuth2Headers() : HttpHeaders {

    let headers = new HttpHeaders(
    );

    headers = headers.append('Authorization', 'Bearer '+this.auth.getAccessToken());
    return headers;
  }
*/
  setAccessToken(token: any): void {
    // Create an expires at ..... don't know when we got the token
    token.expires_at = Math.round((new Date().valueOf()) / 1000) + token.expires_in;
    localStorage.setItem('withingsToken', JSON.stringify(token));
    this.accessToken = token.access_token;
    console.log('Stored access token');
    this.tokenChange.emit(token);
  }

  private delay(ms: number): Promise<any> {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }



}
