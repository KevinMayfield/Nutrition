import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {DatePipe} from '@angular/common';
import {Observations} from "../models/observations";
import {MeasurementSetting} from "../models/enums/MeasurementSetting";
import {LocalService} from "./local.service";
import {EPRService} from "./epr.service";

@Injectable({
  providedIn: 'root'
})
export class WithingsService {

  private accessToken = undefined;

  private refreshingToken = false;

  url = 'https://wbsapi.withings.net';
  private redirect: string | undefined;
  constructor(private http: HttpClient,
              private localStore: LocalService,
            private epr: EPRService,
              private datePipe: DatePipe) { }


  tokenChange: EventEmitter<any> = new EventEmitter();

  sleepMeasures: EventEmitter<Observations> = new EventEmitter();
  bodyMeasures: EventEmitter<Observations[]> = new EventEmitter();
  public async getMeasures(): Promise<void> {

    if (!this.hasAccessToken()) {
      return;
    }
    /*

    Withing actual api reports this is not implemented, docs say otherwise
    this.getAPIInterDayMeasures().subscribe(result=> {
      console.log(result)
    })

     */
    // @ts-ignore
    this.getAPIMeasures().subscribe((result) => {
          if (result.status === 401) {
            console.log('Withings 401', result);
            this.deleteAccessToken();
          } else {
            if (result.body !== undefined && result.body.measuregrps !== undefined) {
              let count = 0;
              let observations: Observations[] = [];
              for (const grp of result.body.measuregrps) {
                count--;
                const obsDate = new Date(+grp.date * 1000);

                const obs: Observations = {
                  day: obsDate,
                  measurementSetting: MeasurementSetting.home
                };
                const tobs: Observations = {
                  day: obsDate,
                  measurementSetting: MeasurementSetting.home
                };
                // console.log(obs);
                for (const measure of grp.measures) {
                  switch (measure.type) {
                    case 1:
                      obs.weight = +measure.value / 1000;
                      break;
                    case 76:
                      obs.muscle_mass = +measure.value / 100;
                      break;
                    case 5 :
                      // free fat mass
                      break;
                    case 8:
                      obs.fat_mass = +measure.value / 100;
                      break;
                    case 11:
                      obs.heartrate = +measure.value;
                      break;
                    case 12:
                      // 5 figure temp?
                      break;
                    case 54:
                      console.log('SPO2 ' + measure.value)
                      break;
                    case 77:
                      obs.hydration = +measure.value / 100;
                      break;
                    case 71:
                      obs.bodytemp = Math.round(+measure.value / 100)/10;
                      break;
                    case 73:
                      obs.skintemp = +measure.value / 1000;
                      break;
                    case 91:
                      obs.pwv = +measure.value / 1000;
                      break;
                    case 9 :
                      obs.diastolic = +measure.value;
                      break;
                    case 10 :
                      obs.systolic = +measure.value;
                      break;
                    case 88 :
                      obs.bone_mass = +measure.value / 1000;
                      break;
                    default:
                      console.log(measure.type + ' ' + measure.value);
                  }
                }
                observations.push(obs);
              }
              this.bodyMeasures.emit(observations)
            }
          }
        },
        (err) => {
          console.log(err);
          if (err.status === 401) {

          }
        }
    );
  }



  getSleep(): void {

    if (!this.hasAccessToken()) { return; }
    console.log('withings has access token')

    this.getAPISleepSummary().subscribe((sleepData) => {
          if (sleepData.status === 401) {
            console.log('Delete access token Withings 401', sleepData);
            this.deleteAccessToken();
          }
          else if (sleepData.status === 403) {
            console.log('Withings 403 - Need to ask for permission', sleepData);

          } else {
            for (const sleep of sleepData.body.series) {
              this.getAPISleepGet(sleep.startdate, sleep.enddate).subscribe(sleepDetail => {

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

                  let measureDay: Observations = {
                    day: startdate,
                    measurementSetting: MeasurementSetting.home,
                    hrv: hrvSum/count,
                    sleepScore: sleep.data.sleep_score,
                    hr_average: sleep.data.hr_average
                  }
                  if (sleep.data.remsleepduration !== undefined) {
                    measureDay.remsleepduration = sleep.data.remsleepduration / 60;
                  }
                  if (sleep.data.sleep_duration !== undefined) {
                    measureDay.sleep_duration = sleep.data.sleep_duration/ 60;
                  }
                  if (sleep.data.lightsleepduration !== undefined) {
                    measureDay.lightsleepduration = sleep.data.lightsleepduration/ 60;
                  }
                  if (sleep.data.durationtosleep !== undefined) {
                    measureDay.durationtosleep = sleep.data.durationtosleep/ 60;
                  }
                  if (sleep.data.deepsleepduration !== undefined) {
                    measureDay.deepsleepduration = sleep.data.deepsleepduration/ 60;
                  }
                  //console.log(measureDay)

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
  private getAPIMeasures(): Observable<any> {

    // Use the postman collection for details

    // https://developer.withings.com/api-reference/#tag/measure/operation/measure-getmeas

    const headers = this.getAPIHeaders();

    const bodge = 'action=getmeas'
        + '&meastypes=1,5,8,9,10,11,12,54,71,73,77,76,88,91,123,135,136,137,138,139'
        + '&category=1'
        + '&startdate=' + Math.floor(this.epr.getFromDate().getTime() / 1000)
        + '&enddate=' + Math.floor(this.epr.getNextToDay().getTime() / 1000);
    // + '&lastupdate='+Math.floor(lastUpdate.getTime()/1000);

    return this.http.post<any>(this.url + '/measure', bodge, { headers} );

  }
  private getAPIInterDayMeasures(): Observable<any> {
    // withings api reports this is not implemented
    const headers = this.getAPIHeaders();

    const bodge = 'action=getintradayactivity'
        + '&datafields=steps,spo2_auto'
        + '&startdate=' + Math.floor(this.epr.getFromDate().getTime() / 1000)
        + '&enddate=' + Math.floor(this.epr.getNextToDay().getTime() / 1000);

    return this.http.post<any>(this.url + '/measure', bodge, { headers} );

  }


  private getAPISleepSummary(): Observable<any> {

    const headers = this.getAPIHeaders();

    // https://developer.withings.com/api-reference/#tag/sleep/operation/sleepv2-getsummary

    const bodge = 'action=getsummary'
        + '&startdateymd=' + this.datePipe.transform(this.epr.getFromDate(), 'yyyy-MM-dd')
        + '&enddateymd=' + this.datePipe.transform(this.epr.getNextToDay(), 'yyyy-MM-dd')
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
    let tolkien = this.localStore.getData('withingsToken')
    if (tolkien !== undefined && tolkien !== '') {

      const token: any = JSON.parse(tolkien);


      if (token !== undefined && token !== null && token.body !== undefined) {
        if (this.isTokenExpired(token)) {
          this.accessToken = undefined;
          this.getRefreshToken();
          return undefined;
        }
        this.accessToken = token.body.access_token;
        // @ts-ignore
        return this.accessToken;
      }
    }
    return undefined;
  }


  public getRefreshToken() {


    if (this.refreshingToken) {
     // console.log('already inprogress refreshing token');
      return ; }
    this.refreshingToken = true;
    var withingsToken = this.localStore.getData('withingsToken')
    if (withingsToken !== null) {
      console.log('withings refreshing token');

      const temp: any = JSON.parse(withingsToken);
      console.log(temp);
      const token = temp.body
      const url = 'https://wbsapi.withings.net/v2/oauth2';
      if (token !== undefined && token.refresh_token !== undefined) {
        const bodge = 'action=requesttoken'
            + '&client_id=' + environment.withingClientId
            + '&client_secret=' + environment.withingSecret
            + '&grant_type=refresh_token'
            + '&refresh_token=' + token.refresh_token
            + '&code=' + temp.authorisationCode;
            + '&redirect_uri=' + temp.routeUrl;

        this.http.post<any>(url, bodge, {headers: {}}).subscribe(
            accesstoken => {

              console.log(accesstoken);
              this.setAccessToken(accesstoken, temp.autauthorisationCode, temp.routeUrl);
              this.refreshingToken = false;
            },
            (err) => {
              console.log(err);
            }
        );
      } else {
        console.log('withings refresh token - missing');
        console.log(token)
      }
    } else {
      console.log('withings token - missing');
    }
  }

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
          this.setAccessToken(token, authorisationCode, routeUrl);
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
   console.log('removed withingToken - deleteAccessToken')
  }
  clearLocalStore() {
    console.log('removed withingToken -ClearlocalStore')
    this.localStore.removeData('withingsToken');
  }

  private getTokenExpirationDate(
      decoded: any
  ): Date | null {

    if (!decoded || !decoded.hasOwnProperty('expires_at')) {
      // Invalid format
      console.log(decoded)
      console.log('removed withingToken - getTokenExpiration date')
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
    } else {
      return !(date.valueOf() > new Date().valueOf() + offsetSeconds * 1000);
    }
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
  setAccessToken(token: any, authorisationCode: string, routeUrl: string): void {
    // Create an expires at ..... don't know when we got the token
    let timeObject = new Date();
    const milliseconds = token.body.expires_in * 1000; // 10 seconds = 10000 milliseconds
    timeObject = new Date(timeObject.getTime() + milliseconds);
    token.expires_at = Math.round(timeObject.getTime() / 1000)
    token.authorisationCode = authorisationCode
    token.routeUrl = routeUrl
    console.log('new Withing accessToken')
    this.localStore.saveData('withingsToken', JSON.stringify(token));
    this.accessToken = token.access_token;
    this.tokenChange.emit(token);
  }




}
