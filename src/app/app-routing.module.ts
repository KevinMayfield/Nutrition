import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {BMIComponent} from "./bmi/bmi.component";
import {MainMenuComponent} from "./main-menu/main-menu.component";
import {ActivityComponent} from "./activity/activity.component";
import {AuthGuardService} from "./service/auth-guard.service";
import {StravaComponent} from "./strava/strava.component";
import {NutritionComponent} from "./nutrition/nutrition.component";

const routes: Routes = [ {
  path: '', component: MainMenuComponent,
  children : [
    { path: '', component: ActivityComponent, canActivate: [AuthGuardService] },
    { path: 'bmi', component: BMIComponent},
    { path: 'activity', component: ActivityComponent, canActivate: [AuthGuardService] },
    { path: 'nutrition', component: NutritionComponent },
    { path: '**', component: StravaComponent }
  ]
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
