import { Injectable } from '@angular/core';
import {StravaService} from "./strava.service";
import {LocalService} from "./local.service";
import {GoogleFitService} from "./google-fit.service";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // ...
  constructor(
              //public strava: StravaService,
              private googleFit : GoogleFitService,
              private localStore: LocalService
  ) {}

  //https://medium.com/@ryanchenkie_40935/angular-authentication-using-route-guards-bf7a4ca13ae3

  public isAuthenticated(): boolean {
    const tolkien = this.localStore.getData("googleFitToken")
    if (tolkien === undefined || tolkien === '') return false;
    const token: any = JSON.parse(tolkien);
    console.log(token)
    if (this.googleFit.isTokenExpired(token) && token.refresh_token !== undefined) {
      this.googleFit.getRefreshToken()
    }
    return !this.googleFit.isTokenExpired(token);
  }
}
