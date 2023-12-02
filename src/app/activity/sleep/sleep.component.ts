import {Component, Input} from '@angular/core';
import {Observations} from "../../models/observations";
import {EPRService} from "../../service/epr.service";



@Component({
  selector: 'app-sleep',
  templateUrl: './sleep.component.html',
  styleUrls: ['./sleep.component.scss']
})
export class SleepComponent {
  measure :Observations[] = []


    sleepScoreData: any[] = []
    sleepData: any[] = []



    scaleMin= 99999;
    scaleMax= 0;

    colorSleep =['lightblue']

    referenceLines= [{ name: 'hr', value: 50 }];
    sleepScoreXAxis: any[] | undefined;
    sleepScoreYAxis: any =
        [
            {
                type: 'value',
                name: 'Sleep Score',
                position: 'left',
                alignTicks: false,
                axisLine: {
                    show: true
                },
                axisLabel: {
                    formatter: '{value} %'
                }
            },
            {
                type: 'value',
                name: 'Sleep Composition',
                position: 'right',
                alignTicks: false,
                axisLine: {
                    show: true
                },
                axisLabel: {
                    formatter: '{value} Mins'
                }
            }
        ]

  @Input() set measures(measure: Observations[]) {

    this.measure = measure
    this.refreshActivity()
  }

    constructor(public epr: EPRService){}

  private refreshActivity() {

      this.colorSleep = []
      this.sleepData = []
      this.sleepScoreData = []
      this.sleepScoreXAxis = undefined
      var sleepScoreXAxis : any = [
              {
                  data: []
              }
          ]

      var sleepData : any[] = [
          {
              name: 'Heart Rate Variability (HRV)',
              type: 'line',
              data: [],
              markLine: {
                  data: [{ type: 'average', name: 'Avg' }]
              }
          },
          {
              name: 'Average Heart Rate',
              type: 'line',
              data: [],
              markLine: {
                  data: [{ type: 'average', name: 'Avg' }]
              }
          }
      ]
      var sleepScoreData : any[] = [
          {
              name: 'Sleep Score',
              color: '#5AA454',
              stack: 'Sleep',
              yAxisIndex: 0,
              type: 'bar',
              data: []
          },
          {
              name: 'Light Sleep Duration',
              color: this.epr.color[1],
              yAxisIndex: 1,
              stack: 'duration',
              type: 'bar',
              data: []
          },
          {
              name: 'REM Sleep Duration',
              color: this.epr.color[2],
              yAxisIndex: 1,
              stack: 'duration',
              type: 'bar',
              data: []
          },
          {
              name: 'Deep Sleep Duration',
              color: this.epr.color[3],
              yAxisIndex: 1,
              stack: 'duration',
              type: 'bar',
              data: []
          }
      ]
    var sleepScore: any[] = []

    if (this.measure !== undefined) {
      for (let measure of this.measure) {

          if (measure.sleepScore !== undefined) {

              sleepScoreXAxis[0].data.push(measure.day.toISOString().split('T')[0])
              const data = {
                  value:measure.sleepScore,
                  itemStyle: {
                      color: this.epr.colorScheme[1]
                  }
              }
              if (measure.sleepScore < 85) {
                 data.itemStyle.color = this.epr.colorScheme[2]
              }
              else if (measure.sleepScore < 50) {
                  data.itemStyle.color = this.epr.colorScheme[3]
              }
              sleepScoreData[0].data.push(data)
              if (measure.lightsleepduration !== undefined) {
                  const data = {
                      value: measure.lightsleepduration,
                  }
                  sleepScoreData[1].data.push(data)
              }
              if (measure.remsleepduration !== undefined) {
                  const data = {
                      value: measure.remsleepduration,
                  }
                  sleepScoreData[2].data.push(data)
              }
              if (measure.deepsleepduration !== undefined) {
                  const data = {
                      value: measure.deepsleepduration,
                  }
                  sleepScoreData[3].data.push(data)
              }

          } else {

          }



          if (measure.hrv !== undefined) {
              if (this.scaleMax < measure.hrv) this.scaleMax = measure.hrv
              if (this.scaleMin > measure.hrv) this.scaleMin = measure.hrv

              const idata: any[] = []
              idata.push(measure.day.toISOString().split('T')[0])
              idata.push(this.round1DP(measure.hrv))
              sleepData[0].data.push(idata)
          }

          if (measure.hr_average !== undefined) {
              if (this.scaleMax < measure.hr_average) this.scaleMax = measure.hr_average
              if (this.scaleMin > measure.hr_average) this.scaleMin = measure.hr_average
              const idata: any[] = []
              idata.push(measure.day.toISOString().split('T')[0])
              idata.push(measure.hr_average)
              sleepData[1].data.push(idata)
          }
      }
    }

      this.sleepScoreData = sleepScoreData
      this.sleepScoreXAxis = sleepScoreXAxis
    this.sleepData = sleepData
  }

    getLastE(data: any[]) {
        return this.epr.getLastE(data)
    }

    getMinE(data: any[]) {
        return this.epr.getMinE(data)
    }
    getMaxE(data: any[]) {
        return this.epr.getMaxE(data)
    }
    getAvgE(data: any[]) {
        return this.epr.getAvgE(data)
    }
    round(value : number) {
        return Math.round(value )
    }
    round1DP(value : number) {
        return Math.round(value * 10) / 10
    }
    getTime(entry: any) {
        return entry.name.toLocaleString().split(',')[0]
    }
    getPointColour(ent: any) {
        return 'color: '+ ent.color+ ';'
    }

    getOK() {
        return this.epr.getOK()
    }
    getWarning() {
        return this.epr.getWarning()
    }
    getInfo() {
        return this.epr.getInfo()
    }

    getLast(series: any[] | undefined) {
       var lastScore = 0
        series?.forEach(dataSeries =>{
            const last = dataSeries.data[dataSeries.data.length -1]
            if (last > 0) lastScore = last
        })
        return lastScore
    }

    getMin(sleepData: any[]) {
        var min = 9999
        sleepData.forEach(series=>{
            if (this.getMinE(series.data) < min) min = this.getMinE(series.data)
        })
        return min;
    }
}
