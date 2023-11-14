import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {SmartService} from "../service/smart.service";
import {ActivityComponent} from "../activity/activity.component";
import {PersonComponent} from "../person/person.component";
import {NutritionComponent} from "../nutrition/nutrition.component";
import {BMIComponent} from "../bmi/bmi.component";
import {EPRService} from "../service/epr.service";

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit{
    pageName = 'Wellness'
    endDate: Date = new Date();
  constructor(private route: ActivatedRoute,
                private epr: EPRService,
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


    event(event: any) {
        if (event instanceof ActivityComponent) {
            this.pageName = 'Wellness - Summary'

        } else if (event instanceof PersonComponent) {
            this.pageName = 'Wellness - User Settings'

        } else if (event instanceof NutritionComponent) {
            this.pageName = 'Wellness - Nutrition'

        } else if (event instanceof BMIComponent) {
            this.pageName = 'Wellness - Healthy Weight Calculator'

        } else {
            this.pageName = 'Wellness'
        }
    }


    addEvent() {
        this.epr.setToDate(this.endDate)
    }
}
