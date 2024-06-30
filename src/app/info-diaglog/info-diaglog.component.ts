import {Component, Inject} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import {CovalentMarkdownModule} from "@covalent/markdown";
import {MatButton} from "@angular/material/button";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-info-diaglog',
  standalone: true,
  imports: [
    CovalentMarkdownModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatButton,
    NgIf
  ],
  templateUrl: './info-diaglog.component.html',
  styleUrl: './info-diaglog.component.scss'
})
export class InfoDiaglogComponent {
  constructor(public dialogRef: MatDialogRef<InfoDiaglogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {}
  ok() {
    this.dialogRef.close(true);
  }
}
