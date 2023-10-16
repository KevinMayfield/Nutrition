import {Component, Input, OnInit} from '@angular/core';
import {SummaryActivity} from "../../models/summary-activity";
import {Color, ScaleType} from "@swimlane/ngx-charts";

@Component({
  selector: 'app-heart-graph',
  templateUrl: './heart-graph.component.html',
  styleUrls: ['./heart-graph.component.scss']
})
export class HeartGraphComponent implements OnInit{
  @Input()
  activity: SummaryActivity | undefined

  single: any[] | undefined;
  colorScheme: Color = {
    domain: [
      'lightgrey', 'lightblue', 'lightgreen', 'lightsalmon', 'lightpink'
    ], group: ScaleType.Ordinal, name: "", selectable: false
  }
  view: [number, number] = [400, 80];

  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  showXAxisLabel = false;
  xAxisLabel = 'Range';
  showYAxisLabel = false;
  yAxisLabel = 'Duration';
  onSelect(event: any) {
    console.log(event);
  }

  ngOnInit(): void {

    if (this.activity !== undefined) {
      var single = []
      if (this.activity.elapsed_time < 120*60 ) {
        var height = 40
        let ratio = Math.round((this.activity.elapsed_time * 4) / (60 * 120))

        this.view = [350, height + (ratio * 40) ]
      }
      else this.view = [350, 240]
      for(let zone of this.activity.zones) {
        if (zone.type === 'heartrate') {
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
