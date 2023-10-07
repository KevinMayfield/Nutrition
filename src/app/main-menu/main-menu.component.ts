import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {TdDialogService} from "@covalent/core/dialogs";
import {client} from "fhirclient";
import {Parameters, QuestionnaireResponse} from "fhir/r4";
import {SmartService} from "../service/smart.service";

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit{

  constructor(private route: ActivatedRoute,
              private http: HttpClient,
              private smart: SmartService) { }
  ngOnInit(): void {
    this.route.queryParams
        .subscribe(params => {
              console.log(params);
              console.log(params['iss']);
              console.log(params['patient']);
              if (params['iss'] !== undefined) {
                this.smart.setEPR(params['iss'])
              }
              if (params['patient'] !== undefined) {
                this.smart.setPatientId(params['patient'])
              }
            }
        );
  }


}
