import {Component, Input, OnInit} from '@angular/core';
import {SummaryActivity} from "../../models/summary-activity";
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

    @Input()
    thisWeek : boolean = true

  single: any[] | undefined;

  view: [number, number] = [400, 100];

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
    showYAxisLabel = true;
    yAxisLabel = 'time (min)';
    @Input()
    widthQuota: number = 1.4;

    constructor(
        private epr: EPRService){
        this.view = [innerWidth / this.widthQuota, this.view[1]];
    }
  onSelect(event: any) {
    console.log(event);
  }

  ngOnInit(): void {

      if (this.epr.person !== undefined && this.epr.person.ftp !== undefined) {
          this.colorScheme.domain = this.epr.getFTPColours()
      }
     if (this.activity !== undefined) {
         if (this.activity.elapsed_time < 120*60 ) {
             var height = 50
             let ratio = Math.round((this.activity.elapsed_time * 4) / (60 * 120))
             this.view = [innerWidth / this.widthQuota, height + (ratio * 40) ]
         }
         else this.view = [innerWidth / this.widthQuota, 240]
         var single: any[] = []
        for(let zone of this.activity.zones) {
            if (zone.type === 'power') {
                zone.distribution_buckets.forEach((res,index)=> {
                    single.push({
                            "name": 'Z'+(index+1),
                            "value": Math.round(res.time/60),
                            "extra": {
                                totalTime: this.activity !== undefined ? Math.round(this.activity.elapsed_time/60) : 0
                            }
                        }
                    )
                })
            }
        }
        this.single = single
     }
  }
    onResize(event: any) {
        this.view = [event.target.innerWidth / this.widthQuota, this.view[1]];
    }
    round(val : number | undefined) {
        if (val == undefined) return undefined
        return Math.round(val)
    }

    duration(time: number ) {
        return this.epr.durationString(time)
    }
}
