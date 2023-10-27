import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, Subscription} from 'rxjs';
import {environment} from '../../environments/environment';
import {Person} from "../models/person";
import {SummaryActivity} from "../models/summary-activity";
import {ActivityType} from "../models/activity-type";
import {Zones} from "../models/stream";



@Injectable({
  providedIn: 'root'
})
export class StravaService {

  url = 'https://www.strava.com/api/v3/';
  private accessToken = undefined;
  private refreshingToken = false;
  tokenChange: EventEmitter<any> = new EventEmitter();
  private athlete?: Person = undefined;
  athleteChange: EventEmitter<any> = new EventEmitter();
  activityMap = new Map();
  private from: Date | undefined;
  private to: Date | undefined;
  public duration = 5; //28; // keep low while developing to avoid hitting rate limits

  loaded: EventEmitter<SummaryActivity> = new EventEmitter();
  activity: EventEmitter<SummaryActivity> = new EventEmitter();
  constructor(private http: HttpClient) {

   this.setToDate(new Date());

   this.activity.subscribe(activity => {
        this.getActivity(activity.id).subscribe(result => {
          activity.kcal = result.calories
          this.getStream(activity.id).subscribe( stream => {
            activity.zones = []
            activity.stream = stream
            this.loaded.emit(activity)
          })
          /*
          this.getActivityZone(activity.id).subscribe(zones => {
            activity.zones = zones
            this.loaded.emit(activity)
          })
*/
        })
    })
  }

  setToDate(date : Date) {
    this.to = date;
    this.from = new Date(this.to.toISOString());
    this.from.setDate(this.from.getDate() - this.duration);
  }

  getHeaders(): HttpHeaders {

    let headers = new HttpHeaders(
    );

    headers = headers.append('Authorization', 'Bearer ' + this.getAccessToken());
    return headers;
  }

  public getAthlete(): Observable<Person> {
    return this.http.get<Person>(this.url + 'athlete', {headers: this.getHeaders()});
  }

  public setAthlete(athlete: Person): void {
    this.athlete = athlete;
    this.athleteChange.emit(athlete);
  }

  public getTokenAthlete(): Person | undefined {
     var tokenStr = localStorage.getItem('stravaAccessToken')
     if (tokenStr === undefined) {
       return undefined
     }
     // @ts-ignore
    var token = JSON.parse(tokenStr)
    console.log('ta' + token.athlete)
    return token.athlete
  }

/*

 Load Activity

  */
  getFromDate(): Date {
    return <Date>this.from;
  }

  getToDate(): Date {
    // @ts-ignore
    return new Date(this.to.toISOString());
  }

  getActivities(page?: number | undefined): void {
    if (page === undefined) {
      this.activityMap = new Map();
    }
    this.getStravaActivities(page).subscribe(
        result => {
          // tslint:disable-next-line:triple-equals
          if (page == undefined) { page = 1; }
          page++;
          if (result.length > 0) {
            for (var res of result) {
              this.activity.emit(res)
            }
            this.getActivities(page);
          } else {
            for (var res of result) {
              this.activity.emit(res)
            }
          }
        },
        (err) => {
          console.log('STRAVA Error - ' + err);
          console.log(err);
          if (err.status === 401) {

          }
        }
    );
  }

  public getActivity(id : string) {
    let uri = this.url + 'activities/'+id //+'?include_all_efforts=';
    return this.http.get<any>(uri, {headers: this.getHeaders()});
  }
  private getActivityZone(id : string) {
    let uri = this.url + 'activities/'+id + '/zones' //+'?include_all_efforts=';
    return this.http.get<any>(uri, {headers: this.getHeaders()});
  }

  public getStravaActivities(page?: string | number | undefined): Observable<any> {
    let uri = this.url + 'athlete/activities';

    uri = uri + '?before=' + Math.floor(this.getToDate().getTime() / 1000)
        + '&after=' + Math.floor(this.getFromDate().getTime() / 1000)
        + '&per_page=30';

    if (page !== undefined) {
      uri = uri + '&page=' + page;
    }
    return this.http.get<any>(uri, {headers: this.getHeaders()});
  }
  private getStream(id: string) {
    let uri = this.url + 'activities/'+id + '/streams?keys=heartrate,watts,time&key_by_type=true' //+'?include_all_efforts=';
    return this.http.get<any>(uri, {headers: this.getHeaders()});
  }


  /*

  OAUTH2

   */


  public authorise(routeUrl: string): void {
    window.location.href = 'http://www.strava.com/oauth/authorize?client_id=' + environment.stravaClientId +
        '&response_type=code&redirect_uri=' + routeUrl + '&approval_prompt=force&scope=read,activity:read_all,profile:read_all';
  }

  setAccessToken(token: { access_token: undefined; }): void {
    console.log(JSON.stringify(token))
    localStorage.setItem('stravaAccessToken', JSON.stringify(token));
    this.accessToken = token.access_token;
    this.tokenChange.emit(token);
  }

  connect(): void {
    const token = this.getAccessToken();
    if (token !== undefined) { this.tokenChange.emit(token); }
  }
  getAccessToken(): string | undefined {

    if (localStorage.getItem('stravaAccessToken') !== undefined) {
      // @ts-ignore
      const token: any = JSON.parse(localStorage.getItem('stravaAccessToken'));

      if (this.isTokenExpired(token)) {
        console.log('Strava refresh token');
        this.accessToken = undefined;
        this.getRefreshToken();
        return undefined;
      }
      if (token !== undefined) {
        this.accessToken = token.access_token;
        return this.accessToken;
      }
    }
    return undefined;
  }

  public getRefreshToken(): Subscription | undefined {
    if (this.refreshingToken) { return undefined; }
    this.refreshingToken = true;
    console.log('Strava token expired');

    // @ts-ignore
    const token: any = JSON.parse(localStorage.getItem('stravaAccessToken'));
    const headers = new HttpHeaders(
    );

    const url = 'https://www.strava.com/oauth/token' +
        '?client_id=' + environment.stravaClientId +
        '&client_secret=' + environment.stravaSecret +
        '&refresh_token=' + token.refresh_token +
        '&grant_type=refresh_token';

    return this.http.post<any>(url, {headers}).subscribe(
        accessToken => {
          console.log('Strava token refreshed');
          this.setAccessToken(accessToken);
          this.refreshingToken = false;
        },
        (err) => {
          console.log('Strava Refresh Error: ', err);
        }
    );
  }

  public getOAuth2AccessToken(authorisationCode: string): void {

    const headers = new HttpHeaders(
    );

    const url = 'https://www.strava.com/oauth/token' +
        '?client_id=' + environment.stravaClientId +
        '&client_secret=' + environment.stravaSecret +
        '&code=' + authorisationCode +
        '&grant_type=authorization_code';

    this.http.post<any>(url, {headers}).subscribe(
        token => {
          this.setAccessToken(token);
        },
        (err) => {
          console.log('Strava Access Error: ', err);
        }
    );
  }



  public getTokenExpirationDate(
      decoded: any
  ): Date | null {

    if (!decoded || !decoded.hasOwnProperty('expires_at')) {
      return null;
    }

    const date = new Date(0);
    date.setUTCSeconds(decoded.expires_at);

    return date;
  }

  public isTokenExpired(
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
  getType(type: ActivityType | undefined) {
    switch(type) {
      case ActivityType.Ride, ActivityType.VirtualRide : {
        return 'directions_bike'
      }
      case ActivityType.Walk : {
        return 'directions_walk'
      }
      case ActivityType.Run : {
        return 'directions_run'
      }
      default : {
        if (type!== undefined && type.toString() === 'Ride') {
          return 'directions_bike'
        }
        console.log(type)
        return 'exercise'
      }
    }


  }



}
