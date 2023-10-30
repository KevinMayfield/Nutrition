import { NgModule } from '@angular/core';
import {MatTableResponsiveDirective} from "./mat-table-responsive.directive";

@NgModule({
  declarations: [MatTableResponsiveDirective],
  exports: [MatTableResponsiveDirective]
})
export class MatTableResponsiveModule { }


// https://stackoverflow.com/questions/31707747/how-to-make-an-angular-material-table-responsive
