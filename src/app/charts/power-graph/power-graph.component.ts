import {Component, Input, OnInit} from '@angular/core';
import {SummaryActivity} from "../../models/summary-activity";
import {EPRService} from "../../service/epr.service";
import {Color, id, ScaleType} from "@swimlane/ngx-charts";

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
   color= this.epr.getFTPColours()
  // options
    @Input()
    widthQuota: number = 1.4;
    height : number | undefined;
    option: any | undefined;

    constructor(
        private epr: EPRService){
    }
  onSelect(event: any) {
    console.log(event);
  }

  ngOnInit(): void {

      if (this.epr.person !== undefined && this.epr.person.ftp !== undefined) {
          this.color = this.epr.getFTPColours()
      }
     if (this.activity !== undefined) {
         var totalTome = this.activity.elapsed_time
         if (this.activity.elapsed_time < 120*60 ) {
             var height = 150
             let ratio = Math.round((this.activity.elapsed_time * 4) / (60 * 120))

             this.height = height + (ratio * 40)
         }
         else {
             this.height = 240

         }

         var singleData: any[]=[{
             data: [],
             type: 'bar',

         }]
         var xAxis: any = {
             type: 'category',
             name: 'Power Zone',
             data: []
         }

        for(let zone of this.activity.zones) {
            if (zone.type === 'power') {
                zone.distribution_buckets.forEach((res,index)=> {
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

    round(val : number | undefined) {
        if (val == undefined) return undefined
        return Math.round(val)
    }

    duration(time: number ) {
        return this.epr.durationString(time)
    }
    getMaxE(data: any[]) {
        return this.epr.getMaxE(data)
    }
}
