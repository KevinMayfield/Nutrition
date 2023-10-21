import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {CovalentDynamicFormsModule} from "@covalent/dynamic-forms";
import {CovalentLayoutModule} from "@covalent/core/layout";
import { CovalentMessageModule } from '@covalent/core/message';
import {CovalentMarkdownModule} from "@covalent/markdown";
import {CovalentHighlightModule} from "@covalent/highlight";
import { CovalentDialogsModule } from '@covalent/core/dialogs';
import { BMIComponent } from './bmi/bmi.component';
import {MatCardModule} from "@angular/material/card";
import {MatTableModule} from "@angular/material/table";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule} from "@angular/forms";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import { MainMenuComponent } from './main-menu/main-menu.component';
import {MatIconModule} from "@angular/material/icon";
import {MatListModule} from "@angular/material/list";
import { ActivityComponent } from './activity/activity.component';
import {SafeHtmlPipe} from "./service/safeHtmlPipe";
import {SafeUrlPipe} from "./service/safeUrl";
import {MatTooltipModule} from "@angular/material/tooltip";
import { StravaComponent } from './strava/strava.component';
import {MatSortModule} from "@angular/material/sort";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatGridListModule} from "@angular/material/grid-list";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatTabsModule} from "@angular/material/tabs";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import { PowerGraphComponent } from './charts/power-graph/power-graph.component';
import {BarChartModule} from "@swimlane/ngx-charts";
import { HeartGraphComponent } from './charts/heart-graph/heart-graph.component';
import {MatChipsModule} from "@angular/material/chips";
import { NutritionComponent } from './nutrition/nutrition.component';
import { SummaryGraphComponent } from './charts/summary-graph/summary-graph.component';

@NgModule({
  declarations: [
    AppComponent,
    BMIComponent,
    MainMenuComponent,
    ActivityComponent,
      SafeHtmlPipe,
      SafeUrlPipe,
      StravaComponent,
      PowerGraphComponent,
      HeartGraphComponent,
      NutritionComponent,
      SummaryGraphComponent
  ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        CovalentLayoutModule,
        FormsModule,

        // (optional) Additional Covalent Modules imports
        CovalentDynamicFormsModule,
        CovalentHighlightModule,
        CovalentMarkdownModule,
        CovalentMessageModule,
        CovalentDialogsModule,
        MatCardModule,
        MatFormFieldModule,
        MatTableModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatTooltipModule,
        MatSortModule,
        MatPaginatorModule,
        MatGridListModule,
        MatSidenavModule,
        MatTabsModule,
        MatProgressBarModule,
        BarChartModule,
        MatChipsModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
