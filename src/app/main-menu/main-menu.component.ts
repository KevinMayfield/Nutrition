import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {HttpClient} from "@angular/common/http";
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

              if (params['iss'] !== undefined) {
                  console.log(params['iss']);
                this.smart.setEPR(params['iss'])
              }
              if (params['patient'] !== undefined) {
                  console.log(params['patient']);
                this.smart.setPatientId(params['patient'])
              }
            }
        );
  }


}
