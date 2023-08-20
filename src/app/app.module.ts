import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {CovalentDynamicFormsModule} from "@covalent/dynamic-forms";
import {CovalentLayoutModule} from "@covalent/core/layout";
import {CovalentMarkdownModule} from "@covalent/markdown";
import {CovalentHighlightModule} from "@covalent/highlight";
import { BMIComponent } from './bmi/bmi.component';
import {MatCardModule} from "@angular/material/card";
import {MatTableModule} from "@angular/material/table";

@NgModule({
  declarations: [
    AppComponent,
    BMIComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CovalentLayoutModule,
    // (optional) Additional Covalent Modules imports
    CovalentDynamicFormsModule,
    CovalentHighlightModule,
    CovalentMarkdownModule,
    MatCardModule,
    MatTableModule
    ,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
