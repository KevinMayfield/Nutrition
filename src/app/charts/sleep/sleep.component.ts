import {Component, Input} from '@angular/core';
import {Color, ScaleType} from "@swimlane/ngx-charts";
import {Observations} from "../../models/observations";
import {curveBasis} from "d3-shape";

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
    curve = curveBasis
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

  @Input() set measures(measure: Observations[]) {

    this.measure = measure
    this.refreshActivity()
  }

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
    var series = []
    series.push(seriesHRV[0])
      series.push(seriesHR[0])
      this.series = series
  }
}
