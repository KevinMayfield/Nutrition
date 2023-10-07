import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {BMIComponent} from "./bmi/bmi.component";
import {MainMenuComponent} from "./main-menu/main-menu.component";

const routes: Routes = [ {
  path: '', component: MainMenuComponent,
  children : [
    { path: '', component: BMIComponent}
  ]
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
