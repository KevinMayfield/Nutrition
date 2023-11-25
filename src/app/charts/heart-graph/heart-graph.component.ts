import {Component, Input, OnInit} from '@angular/core';
import {SummaryActivity} from "../../models/summary-activity";
import {EPRService} from "../../service/epr.service";

@Component({
  selector: 'app-heart-graph',
  templateUrl: './heart-graph.component.html',
  styleUrls: ['./heart-graph.component.scss']
})
export class HeartGraphComponent implements OnInit{

  @Input()
  activity: SummaryActivity | undefined

  single: any[] | undefined;
  color = ['lightgrey', 'lightblue', 'lightgreen', 'lightsalmon', 'lightpink']
  height : number | undefined;
  option: any | undefined;
  @Input()
  widthQuota: number = 1.4;

  constructor(private epr : EPRService) {

  }


  round(val : number | undefined) {
    if (val == undefined) return undefined
    return Math.round(val)
  }
  ngOnInit(): void {

    if (this.activity !== undefined) {
      if (this.activity.elapsed_time !== undefined) {
        var single: any[] = []
        var totalTome = this.activity.elapsed_time
        if (this.activity.elapsed_time < 120 * 60) {
          var height = 150
          let ratio = Math.round((this.activity.elapsed_time * 4) / (60 * 120))

          this.height = height + (ratio * 40)
        } else this.height =  240

        var singleData: any[]=[{
          data: [],
          type: 'bar',

        }]
        var xAxis: any = {
          type: 'category',
          name: 'Heart Zone',
          data: []
        }
        for (let zone of this.activity.zones) {
          if (zone.type === 'heartrate') {
            zone.distribution_buckets.forEach((res, index) => {
              xAxis.data.push('Z'+(index+1))
              singleData[0].data.push({
                value: Math.round(res.time/60),
                name: Math.round((res.time) * 100 / totalTome),
                itemStyle: {
                  color: this.color[index]
                }
              })
            })
          }
        }

        this.single = single
        this.option = {
          tooltip: {
            trigger: 'axis',
            formatter: (params: any[]) => {
              return `
                Duration: <br />
                ${params[0].value} mins (${params[0].data.name}%)
                `;
            }
          },
          xAxis: xAxis,
          yAxis: {
            type: 'value',
            name: 'time (mins)'
          },
          series: singleData,
          legend: {
            data: [],
            left: 'center',
            bottom: 10
          }
        }
      }
    }
  }

  duration(time: number ) {
    return this.epr.durationString(time)
  }
}
