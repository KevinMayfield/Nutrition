import { Injectable } from '@angular/core';
import {JwtHelperService} from "@auth0/angular-jwt";
import {StravaService} from "./strava.service";
import {LocalService} from "./local.service";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // ...
  constructor(
              public strava: StravaService, private localStore: LocalService
  ) {}

  //https://medium.com/@ryanchenkie_40935/angular-authentication-using-route-guards-bf7a4ca13ae3

  public isAuthenticated(): boolean {
    const token = this.localStore.getData('stravaAccessToken');

    // Check whether the token is expired and return
    // true or false

    return !this.strava.isTokenExpired(token); //!this.jwtHelper.isTokenExpired(token);
  }
}
