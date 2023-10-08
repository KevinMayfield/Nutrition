import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {BMIComponent} from "./bmi/bmi.component";
import {MainMenuComponent} from "./main-menu/main-menu.component";
import {RestingMetabolicRateComponent} from "./resting-metabolic-rate/resting-metabolic-rate.component";

const routes: Routes = [ {
  path: '', component: MainMenuComponent,
  children : [
    { path: '', component: RestingMetabolicRateComponent},
    { path: 'bmi', component: BMIComponent},
    { path: 'nutrition', component: RestingMetabolicRateComponent}
  ]
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
