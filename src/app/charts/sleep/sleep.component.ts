import {Component, Input} from '@angular/core';
import {Color, LegendPosition, ScaleType} from "@swimlane/ngx-charts";
import {Observations} from "../../models/observations";
import {curveBasis, curveCatmullRom} from "d3-shape";
import {EPRService} from "../../service/epr.service";
import {StravaService} from "../../service/strava.service";

@Component({
  selector: 'app-sleep',
  templateUrl: './sleep.component.html',
  styleUrls: ['./sleep.component.scss']
})
export class SleepComponent {
  measure :Observations[] = []

  sleepScore: any[] | undefined
  hrv: any[] | undefined
  avg_hearrate : any[] | undefined
   seriesHRV: any[] | undefined
    seriesHR: any[] | undefined
    series: any[] | undefined

  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  timeline: boolean = false;
    curve = curveCatmullRom
    //  curve = curveBasis
  showXAxisLabel = false;
  showYAxisLabel = true;
    scaleMin= 99999;
    scaleMax= 0;
  colorScheme: Color = {
    domain: [
       'lightblue'
    ], group: ScaleType.Ordinal, name: "", selectable: false
  }
    colorSleep: Color = {
        domain: [
            'lightblue'
        ], group: ScaleType.Ordinal, name: "", selectable: false
    }
    colorSeries = {
        domain: [ '#7aa3e5','#5AA454','#CFC0BB', '#E44D25',  '#a8385d', '#aae3f5']
        , group: ScaleType.Ordinal, name: "", selectable: false
    };
    colorSeries2 = {
        domain: [ '#5AA454','#7aa3e5','#CFC0BB', '#E44D25',  '#a8385d', '#aae3f5']
        , group: ScaleType.Ordinal, name: "", selectable: false
    };
    legendPosition: LegendPosition = LegendPosition.Below;
    referenceLines= [{ name: 'hr', value: 50 }];

  @Input() set measures(measure: Observations[]) {

    this.measure = measure
    this.refreshActivity()
  }

    constructor(public epr: EPRService){}

  private refreshActivity() {
    this.sleepScore = undefined
      this.colorSleep.domain = []
    this.hrv = undefined
    this.avg_hearrate = undefined
      this.seriesHRV = undefined
      this.seriesHR = undefined
      this.series = undefined
    var sleepScore: any[] = []
    var hrv: any[] = []
    var avg_heartrate: any[] = []
      var seriesHRV: any[] = [{
        name: 'HRV',
          series: []
      }]
      var avg_heartrate: any[] = []
      var seriesHR: any[] = [
          {
              name: 'Avg Heart Rate',
              series: []
          }]
    if (this.measure !== undefined) {

      for (let measure of this.measure) {

          let entSleep = {
              name: measure.day,
              value: 0
          }
          if (measure.sleepScore !== undefined) {
              entSleep.value = measure.sleepScore
              if (measure.sleepScore > 85) this.colorSleep.domain.push('#5AA454')
              else if (measure.sleepScore > 50) this.colorSleep.domain.push('#C7B42C')
              else this.colorSleep.domain.push('#A10A28')
          } else {
              this.colorSleep.domain.push('#AAAAAA')
          }
          sleepScore.push(entSleep)

          let entHrv = {
              name: measure.day,
              value: 0
          }
          if (measure.hrv !== undefined) {
              if (this.scaleMax < measure.hrv) this.scaleMax = measure.hrv
              if (this.scaleMin > measure.hrv) this.scaleMin = measure.hrv
              entHrv.value = measure.hrv
          }
          hrv.push(entHrv)


          let entAvgHeartrate = {
              name: measure.day,
              value: 0
          }
          if (measure.hr_average !== undefined) {
              if (this.scaleMax < measure.hr_average) this.scaleMax = measure.hr_average
              if (this.scaleMin > measure.hr_average) this.scaleMin = measure.hr_average
              entAvgHeartrate.value = measure.hr_average
          }
          avg_heartrate.push(entAvgHeartrate)

          if (measure.hr_average !== undefined) {
              seriesHRV[0].series.push(entHrv)
              seriesHR[0].series.push(entAvgHeartrate)
          }
      }
    }
    this.sleepScore = sleepScore
    this.hrv = hrv
    this.avg_hearrate = avg_heartrate
      this.seriesHRV = seriesHRV
      this.seriesHR = seriesHR
      let referenceLines = []
      let sum = 0

      if (this.seriesHR.length > 0 && this.seriesHR[0].series !== undefined) {
          sum =0
          this.seriesHR[0].series.forEach((entry: any) => {
              sum += entry.value
          })
          referenceLines.push({
              name: 'Average Heart Rate',
              value: Math.round(sum / this.seriesHR[0].series.length)
          })
      }
      if (this.seriesHRV.length > 0 && this.seriesHRV[0].series !== undefined) {
          sum =0
          this.seriesHRV[0].series.forEach((entry: any) => {
              sum += entry.value
          })
          referenceLines.push({
              name: 'Average Heart Rate Variability',
              value: Math.round(sum / this.seriesHRV[0].series.length)
          })
      }

      this.referenceLines = referenceLines

    var series = []
    series.push(seriesHRV[0])
      series.push(seriesHR[0])
      this.series = series
  }

    getLast(series: any[] | undefined) {
        if (series == undefined) return undefined
        if (series.length === 0 ) return undefined
        var latest : any = undefined
        if (series[0].series !== undefined) {
            series[0].series.forEach((entry: any) => {
                if (latest == undefined) latest = entry
                else if (latest.name < entry.name) {
                    latest = entry
                }
            })
        } else {
            series.forEach((entry: any) => {
                if (latest == undefined) latest = entry
                else if (latest.name < entry.name) {
                    latest = entry
                }
            })
        }
        if (latest !== undefined) return latest.value
        return undefined
    }
    round(value : number) {
        return Math.round(value )
    }
}
