import {Component, Input, OnInit} from '@angular/core';
import {SummaryActivity} from "../../models/summary-activity";
import {HttpClient} from "@angular/common/http";
import {EPRService} from "../../service/epr.service";
import {Color, ScaleType} from "@swimlane/ngx-charts";

@Component({
  selector: 'app-power-graph',
  templateUrl: './power-graph.component.html',
  styleUrls: ['./power-graph.component.scss']
})
export class PowerGraphComponent implements OnInit{
  @Input()
  activity: SummaryActivity | undefined

  single: any[] | undefined;

  view: [number, number] = [500, 100];

    colorScheme: Color = {
        domain: [
            'lightgrey', 'lightblue', 'lightgreen', 'lightsalmon', 'lightpink'
        ], group: ScaleType.Ordinal, name: "", selectable: false
    }

  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  showXAxisLabel = false;
  xAxisLabel = 'Range';
  showYAxisLabel = false;
  yAxisLabel = 'Duration';

    constructor(
        private epr: EPRService){}
  onSelect(event: any) {
    console.log(event);
  }

  ngOnInit(): void {

      if (this.epr.person !== undefined && this.epr.person.ftp !== undefined) {

          var colours : string[] = []
          let ftp = this.epr.person.ftp

          for(let i=0;i<10;i++) {
              let pwr = (i *50)  ; // crude

              if (pwr < (ftp * 0.54)) {
                  colours.push('lightgrey')
              } else if (pwr < (ftp * 0.74)) {
                  colours.push('lightblue')
              } else if (pwr < (ftp * 0.89)) {
                  colours.push('lightgreen')
              } else if (pwr < (ftp * 1.04)) {
                  colours.push('lightsalmon')
              } else if (pwr < (ftp * 1.20)) {
                  colours.push('lightpink')
              }
              else {
                  colours.push('lightcoral')
              }
          }

          this.colorScheme.domain = colours
      }
     if (this.activity !== undefined) {
         if (this.activity.elapsed_time < 120*60 ) {
             var height = 50
             let ratio = Math.round((this.activity.elapsed_time * 4) / (60 * 120))
             this.view = [500, height + (ratio * 40) ]
         }
         else this.view = [500, 240]
         var single = []
        for(let zone of this.activity.zones) {
            if (zone.type === 'power') {
                for (let res of zone.distribution_buckets) {
                    single.push({
                            "name": res.min,
                            "value": Math.round(res.time/60)
                        }
                    )
                }
            }
        }
        this.single = single
     }
  }
}
