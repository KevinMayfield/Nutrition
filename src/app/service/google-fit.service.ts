import {EventEmitter, Injectable} from '@angular/core';
import {environment} from "../../environments/environment";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {LocalService} from "./local.service";
import {Observations} from "../models/observations";
import {MeasurementSetting} from "../models/enums/MeasurementSetting";
import {EPRService} from "./epr.service";
import {StravaService} from "./strava.service";

@Injectable({
  providedIn: 'root'
})
export class GoogleFitService {
  private redirect: string | undefined;
  private accessToken = undefined;
  tokenChange: EventEmitter<any> = new EventEmitter();
  bodyMeasures: EventEmitter<Observations[]> = new EventEmitter();
  private refreshingToken = false;
  constructor(private http: HttpClient,
              private epr: EPRService,
              private strava: StravaService,
              private localStore: LocalService) { }

  public getDataSources() {

    /*

    This gets a list of datasources https://developers.google.com/fit/rest/v1/reference/users/dataSources/get

    and then gets datassets

    https://developers.google.com/fit/rest/v1/reference/users/dataSources/datasets/get
     */

    this.getAPIDataSources().subscribe(result => {
      if (result.dataSource !== undefined) {
        result.dataSource.forEach((source : any) => {
          if (source.dataType !== undefined) {
            if (source.dataType.name !== undefined) {
              let systemUri = source.dataType.name
              if (systemUri === 'com.google.height') {
                this.getAPIDataset(source.dataStreamId).subscribe(data => {
                  if (data.point !== undefined) {
                    var measure: Observations[] = []
                    data.point.forEach((point: any) => {
                      if (point.startTimeNanos !== undefined) {
                        let obsDate = new Date(point.startTimeNanos / 1000000);
                        measure.push({
                          measurementSetting: MeasurementSetting.home,
                          day: obsDate,
                          height: point.value[0].fpVal
                        })
                        this.epr.setHeight(Math.round(point.value[0].fpVal * 100))
                      }
                    })
                    this.bodyMeasures.emit(measure)
                  }
                })
              } else if (systemUri === 'com.google.weight' && source.dataStreamId === 'derived:com.google.weight:com.google.android.gms:merge_weight') {
                this.getAPIDataset(source.dataStreamId).subscribe(data => {
                  if (data.point !== undefined) {
                    var measure: Observations[] = []
                    data.point.forEach((point: any) => {
                      if (point.startTimeNanos !== undefined) {
                        let obsDate = new Date(point.startTimeNanos / 1000000);
                        measure.push({
                          measurementSetting: MeasurementSetting.home,
                          day: obsDate,
                          weight: point.value[0].fpVal
                        })
                      }
                    })
                    if (measure.length > 0) {
                      var sum = 0
                      measure.forEach(obs=>{
                        if (obs.weight !== undefined) sum += obs.weight
                      })
                      const weight = Math.round(10 *sum/measure.length)/10
                      if (this.epr.person.weight === undefined || this.epr.person.weight !== weight) {
                        this.epr.setWeight(weight)
                        this.strava.updateWeight(weight).subscribe(result => {
                          console.log(result)
                        })
                      }
                    }
                  }
                })
              } else if (systemUri === 'com.google.oxygen_saturation') {
                if (source.dataStreamId !== undefined
                   && source.dataStreamId.startsWith('raw:')
                ) {
                  this.getAPIDataset(source.dataStreamId).subscribe(data => {
                    if (data.point !== undefined) {
                      var measure: Observations[] = []
                      data.point.forEach((point: any) => {
                        if (point.startTimeNanos !== undefined) {
                          let obsDate = new Date(point.startTimeNanos / 1000000);
                          measure.push({
                            measurementSetting: MeasurementSetting.home,
                            day: obsDate,
                            spo2: {
                              avg: point.value[0].fpVal
                            }
                          })
                        }
                      })

                      this.bodyMeasures.emit(measure)
                    }
                  })
                }
              } else if (systemUri === 'com.google.blood_glucose') {
                if (source.dataStreamId !== undefined && source.dataStreamId.startsWith('raw:') ) {
                  this.getAPIDataset(source.dataStreamId).subscribe(data => {
                    if (data.point !== undefined) {

                      var measure : Observations[] = []
                      data.point.forEach((point: any) => {
                        if (point.startTimeNanos !== undefined) {
                          let obsDate = new Date(point.startTimeNanos / 1000000);
                          measure.push({
                            measurementSetting: MeasurementSetting.home,
                            day: obsDate,
                            glucose: {
                              val: point.value[0].fpVal
                            }})
                        }
                      })
                      this.bodyMeasures.emit(measure)
                    }
                  })
                }
              } else if (systemUri === 'com.google.body.temperature') {
                this.getAPIDataset(source.dataStreamId).subscribe(data => {
                  console.log(source.dataStreamId)
                  if (source.dataStreamId !== undefined && source.dataStreamId === 'derived:com.google.body.temperature:com.google.android.gms:merged') {
                    if (data.point !== undefined) {

                      var measure: Observations[] = []
                      data.point.forEach((point: any) => {
                        if (point.startTimeNanos !== undefined) {
                          let obsDate = new Date(point.startTimeNanos / 1000000);
                          measure.push({
                            measurementSetting: MeasurementSetting.home,
                            day: obsDate,
                            bodytemp: point.value[0].fpVal
                            })
                        }
                      })

                      this.bodyMeasures.emit(measure)
                    }
                  }
                })
              } else
               {
                // DEBUG
                 console.log(systemUri)
              }
            }
          }
        })
      }
    })
  }
  public getSteps() {
    this.getAPISteps().subscribe(result => {
      let measure: Observations[] = []
      if (result.bucket !== undefined) {
        result.bucket.forEach((bucket: any) => {
          if (bucket.dataset !== undefined) {
            bucket.dataset.forEach((dataset: any) => {
              if (dataset.point !== undefined) {
                dataset.point.forEach((point: any) => {
                  if (point.startTimeNanos !== undefined) {
                    let obsDate = new Date(point.startTimeNanos / 1000000);
                   measure.push({
                      measurementSetting: MeasurementSetting.home,
                      day: obsDate,
                      steps: point.value[0].intVal
                    })
                  }
                })
              }
            })
          }
        })
        this.bodyMeasures.emit(measure)
      }
    })
  }

  public getHbA1c() {
    this.getAPIHbA1c().subscribe( (result:any)  => {
      let measure: Observations[] = []
      if (result.bucket !== undefined) {
        result.bucket.forEach((bucket: any) => {
          if (bucket.dataset !== undefined) {
            bucket.dataset.forEach((dataset: any) => {
              if (dataset.point !== undefined) {
                dataset.point.forEach((point: any) => {
                  if (point.startTimeNanos !== undefined) {
                    let obsDate = new Date(point.startTimeNanos / 1000000);
                           measure.push({
                                 measurementSetting: MeasurementSetting.home,
                                 day: obsDate,
                                 glucose: {
                                   val: point.value[0].fpVal
                                 }})

                  }
                })
              }
            })
          }
        })
        this.bodyMeasures.emit(measure)
      }
    })
  }


  getSPO2() {
    /*
    this.getAPISPO2Raw().subscribe(result => {
      console.log(result)
    })
     */
    this.getAPISPO2().subscribe(result => {
      let measure: Observations[] = []
      if (result.bucket !== undefined) {
        result.bucket.forEach((bucket: any) => {
          if (bucket.dataset !== undefined) {
            bucket.dataset.forEach((dataset: any) => {
              if (dataset.point !== undefined) {
                  dataset.point.forEach((point: any) => {
                    if (point.startTimeNanos !== undefined) {
                        let obsDate = new Date(point.startTimeNanos / 1000000);

                        measure.push({
                          measurementSetting: MeasurementSetting.home,
                          day: obsDate,
                          spo2: {
                           // avg: point.value[0].fpVal,
                            max: point.value[1].fpVal,
                            min: point.value[2].fpVal,
                          }
                        })
                    }
                  })
              }
            })
          }
        })
        this.bodyMeasures.emit(measure)
      }
    })
  }

  getAPIDataset(dataSourceId : string) {
    const headers = this.getAPIHeaders();
    const startTimeNano = this.epr.getFromDate().getTime() * 1000000
    const endTimeNano = this.epr.getToDate().getTime() * 1000000
    const url = 'https://www.googleapis.com/fitness/v1/users/me/dataSources/'+dataSourceId+'/datasets/'
        +startTimeNano + '-' + endTimeNano
       // +'?fields=point%2Fvalue%2FfpVal'
       // +'?fields=' + fields
    return this.http.get<any>(url ,  { headers} );
  }
  getAPISteps() {
    const headers = this.getAPIHeaders();
    const url = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate'
      let body = {
        "aggregateBy": [{
          "dataTypeName": "com.google.step_count.delta",
          "dataSourceId": "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
        }],
        "bucketByTime": { "durationMillis": 86400000 },
        "startTimeMillis": this.epr.getFromDate().getTime(),
        "endTimeMillis": this.epr.getToDate().getTime()
      }
    return this.http.post<any>(url , body, { headers} );
  }
  getAPIHbA1c() {
    const headers = this.getAPIHeaders();
    const url = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate'
    let body = {
      "aggregateBy": [{
        "dataTypeName": "com.google.blood_glucose",
        "dataSourceId": "derived:com.google.blood_glucose:com.google.android.gms:merged"
      }],
      "bucketByTime": { "durationMillis": 86400000 },
      "startTimeMillis": this.epr.getFromDate().getTime(),
      "endTimeMillis": this.epr.getToDate().getTime()
    }
    return this.http.post<any>(url , body, { headers} );
  }
  getAPISPO2() {
    const headers = this.getAPIHeaders();
    const url = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate'
    let body = {
      "aggregateBy": [{
        "dataTypeName": "com.google.oxygen_saturation",
        "dataSourceId": "derived:com.google.oxygen_saturation:com.google.android.gms:merged"
      }],
      "bucketByTime": { "durationMillis": 86400000 },
      "startTimeMillis": this.epr.getFromDate().getTime(),
      "endTimeMillis": this.epr.getToDate().getTime()
    }
    return this.http.post<any>(url , body, { headers} );
  }
  getAPISPO2Raw() {
    const headers = this.getAPIHeaders();
    console.log(this.epr.getFromDate().getTime())
    const url = 'https://www.googleapis.com/fitness/v1/users/me/dataSources?dataTypeName=com.google.oxygen_saturation'

    return this.http.get<any>(url ,  { headers} );
  }

  private getAPIDataSources() {
    const headers = this.getAPIHeaders();
    const url = 'https://www.googleapis.com/fitness/v1/users/me/dataSources'

    return this.http.get<any>(url ,  { headers} );
  }

    clearLocalStore() {
      console.log('removed googleFitToken -ClearlocalStore')
      this.localStore.removeData('googleFitToken');
    }
  getAPIHeaders(): HttpHeaders {

    let headers = new HttpHeaders(
    );

    headers = headers.append('Authorization', 'Bearer ' + this.getAccessToken());
   // headers.append('Content-Type', 'application/x-www-form-urlencoded');
    return headers;
  }
  getAccessToken() {

    let tolkien = this.localStore.getData('googleFitToken')

    if (tolkien !== undefined && tolkien !== '') {

      const token: any = JSON.parse(tolkien);

      if (token !== undefined && token !== null ) {
        if (this.isTokenExpired(token)) {
          this.accessToken = undefined;
          this.getRefreshToken();
          return undefined;
        }
        this.accessToken = token.access_token;
        // @ts-ignore
        return this.accessToken;
      }
    }
    return undefined;
  }

  authorise(routeUrl: string) {
    if (routeUrl.substring(routeUrl.length - 1, 1) === '/') {
      routeUrl = routeUrl.substring(0, routeUrl.length - 1);
    }
    this.redirect = routeUrl;
    window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?'
        + 'redirect_uri=' + routeUrl
        + '&prompt=consent'
        + '&response_type=code'
        + '&client_id='+ environment.googleClientId
        + '&state=google'
        + '&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.activity.read'
        + '+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.body.read'
        + '+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.nutrition.read'
        + '+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.oxygen_saturation.read'
        + '+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.sleep.read'
        + '+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.blood_glucose.read'
        + '+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.body_temperature.read'
        + '+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.body.write'
        + '+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.blood_pressure.read'
        + '+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.blood_pressure.write'
        '&access_type=offline';
  }

  getOAuth2AccessToken(authorisationCode: any, routeUrl: string) {

    /*
    code=4%2F0AfJohXkeCEACrNTYUFRt66Rwm6WwNsV2TY8WqOI6E6AiUTM2q0NMU9FB8SDRKYUMvZhvwg
    &redirect_uri=https%3A%2F%2Fdevelopers.google.com%2Foauthplayground
    &client_id=407408718192.apps.googleusercontent.com
    &client_secret=************
    &scope=
    &grant_type=authorization_code
     */
    let headers = new HttpHeaders(
    );
    headers = headers.append('content-type', 'application/x-www-form-urlencoded');
    const url = 'https://oauth2.googleapis.com/token';
    const bodge = 'code=' + authorisationCode
            + '&redirect_uri=' + routeUrl
        + '&client_id=' + environment.googleClientId
        + '&client_secret=' + environment.googleClientSecret
        + '&scope='
        + '&grant_type=authorization_code'
        ;

    this.http.post<any>(url, bodge, { headers} ).subscribe(
        token => {
          console.log('google Access Token');
          this.setAccessToken(token);
        },
        (err) => {
          console.log(err);
        }
    );
  }
  setAccessToken(token: any): void {
    // Create an expires at ..... don't know when we got the token
    let timeObject = new Date();
    const milliseconds = token.expires_in * 1000; // 10 seconds = 10000 milliseconds
    timeObject = new Date(timeObject.getTime() + milliseconds);
    token.expires_at = Math.round(timeObject.getTime() / 1000)
    if (token.refresh_token === undefined) {
      let tempToken = this.localStore.getData('googleFitToken');
      if (tempToken !== undefined && tempToken !== '') {
        let jsonToken = JSON.parse(tempToken)
        if (jsonToken.refresh_token !== undefined) {
          console.log('Stored previous refrehs token')
          token.refresh_token = jsonToken.refresh_token
        }
      }
    }
    console.log('new GoogleFit accessToken')
    this.localStore.saveData('googleFitToken', JSON.stringify(token));
    this.accessToken = token.access_token;
    this.tokenChange.emit(token);
  }

  isTokenExpired(
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
  private getTokenExpirationDate(
      decoded: any
  ): Date | null {

    if (!decoded || !decoded.hasOwnProperty('expires_at')) {
      // Invalid format
      console.log('removed googleFitToken - getTokenExpiration date')
      return null;
    }

    const date = new Date(0);
    date.setUTCSeconds(decoded.expires_at);
    return date;
  }
  public getRefreshToken() {
    if (this.refreshingToken) {
      // console.log('already inprogress refreshing token');
      return ; }
    this.refreshingToken = true;
    var googleFitToken = this.localStore.getData('googleFitToken')
    if (googleFitToken !== null) {
      console.log('googleFit refreshing token');
      const token: any = JSON.parse(googleFitToken);

      const url = 'https://oauth2.googleapis.com/token';
      if (token !== undefined && token.refresh_token !== undefined) {

        /*
        client_secret=************
        &grant_type=refresh_token
        &refresh_token=1%2F%2F04JuzbiKSOKVSCgYIARAAGAQSNwF-L9Ir-1AGn6Nz4xz3-nFqZcBri21DFhJXuD9V9coX3SMFg4neN0fGZXozJiM4sukG1Xk-hWA
        &client_id=407408718192.apps.googleusercontent.com
         */
        const bodge = 'client_secret=' + environment.googleClientSecret
             + '&grant_type=refresh_token'
            + '&refresh_token=' + token.refresh_token
            + '&client_id=' + environment.googleClientId;
        let headers = new HttpHeaders(
        );
        headers = headers.append('content-type', 'application/x-www-form-urlencoded');
        this.http.post<any>(url, bodge, {headers}).subscribe(
            accesstoken => {

              console.log(accesstoken);
              this.setAccessToken(accesstoken);
              this.refreshingToken = false;
            },
            (err) => {
              console.log(err);
            }
        );
      } else {
        console.log('googleFitToken refresh token - missing');
        console.log(token)
      }
    } else {
      console.log('googleFitToken token - missing');
    }
  }



}
