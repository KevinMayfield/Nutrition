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
    const token = this.localStore.getData("googleFitToken")
    return !this.googleFit.isTokenExpired(token); //!this.jwtHelper.isTokenExpired(token);
/*
    const token = this.localStore.getData('stravaToken');

    // Check whether the token is expired and return
    // true or false

    return !this.strava.isTokenExpired(token); //!this.jwtHelper.isTokenExpired(token);*/
  }
}
