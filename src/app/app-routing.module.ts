import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {BMIComponent} from "./bmi/bmi.component";
import {MainMenuComponent} from "./main-menu/main-menu.component";
import {ActivityComponent} from "./activity/activity.component";
import {AuthGuardService} from "./service/auth-guard.service";
import {LoginComponent} from "./login/login.component";
import {NutritionComponent} from "./nutrition/nutrition.component";
import {PersonComponent} from "./person/person.component";
import {ChatOpenAIComponent} from "./chat-open-ai/chat-open-ai.component";

const routes: Routes = [ {
  path: '', component: MainMenuComponent,
  children : [
    { path: '', component: ActivityComponent, canActivate: [AuthGuardService] },
    { path: 'bmi', component: BMIComponent, canActivate: [AuthGuardService]},
    { path: 'person', component: PersonComponent, canActivate: [AuthGuardService]},
    { path: 'summary', component: ActivityComponent, canActivate: [AuthGuardService] },
    { path: 'nutrition', component: NutritionComponent, canActivate: [AuthGuardService] },
    { path: 'chat', component: ChatOpenAIComponent, canActivate: [AuthGuardService] },
    { path: '**', component: LoginComponent }
  ]
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
