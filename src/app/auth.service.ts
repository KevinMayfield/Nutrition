import { Injectable } from '@angular/core';
import {JwtHelperService} from "@auth0/angular-jwt";
import {StravaService} from "./service/strava.service";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // ...
  constructor(
              public strava: StravaService
  ) {}

  //https://medium.com/@ryanchenkie_40935/angular-authentication-using-route-guards-bf7a4ca13ae3

  public isAuthenticated(): boolean {
    const token = localStorage.getItem('stravaAccessToken');
    console.log('AuthService ' + token)
    // Check whether the token is expired and return
    // true or false
   console.log('strava jwt '+ this.strava.isTokenExpired(token))
    return !this.strava.isTokenExpired(token); //!this.jwtHelper.isTokenExpired(token);
  }
}
