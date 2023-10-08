import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {BMIComponent} from "./bmi/bmi.component";
import {MainMenuComponent} from "./main-menu/main-menu.component";
import {RestingMetabolicRateComponent} from "./resting-metabolic-rate/resting-metabolic-rate.component";
import {AuthGuardService} from "./auth-guard.service";
import {StravaComponent} from "./strava/strava.component";

const routes: Routes = [ {
  path: '', component: MainMenuComponent,
  children : [
    { path: '', component: RestingMetabolicRateComponent, canActivate: [AuthGuardService] },
    { path: 'bmi', component: BMIComponent},
    { path: 'nutrition', component: RestingMetabolicRateComponent, canActivate: [AuthGuardService] },
    { path: '**', component: StravaComponent }
  ]
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
