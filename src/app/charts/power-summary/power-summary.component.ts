import {Component, Input, OnInit} from '@angular/core';
import {ActivityDay} from "../../models/activity-day";
import {hrZone} from "../../models/person";
import {Color, ScaleType} from "@swimlane/ngx-charts";
import {EPRService} from "../../service/epr.service";
import {StravaService} from "../../service/strava.service";

@Component({
  selector: 'app-power-summary',
  templateUrl: './power-summary.component.html',
  styleUrls: ['./power-summary.component.scss']
})
export class PowerSummaryComponent implements OnInit {


  activity: ActivityDay[] | undefined


  @Input()
  thisWeek : boolean = true

  @Input()
  widthQuota: number = 3;

  @Input() set dayActivity(activity: ActivityDay[]) {

    this.activity = activity
    this.refreshActivity()
  }
  @Input()
  zoneHR: hrZone | undefined

  multi: any[] | undefined;
  single: any[] | undefined;
  totalTime = 0;

  view: [number, number] = [800, 300];

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
  showXAxisLabel = true;
  xAxisLabel = 'Power (watts)';
  showYAxisLabel = true;
  yAxisLabel = 'time (min)';

  constructor(
      private epr: EPRService,
      private strava: StravaService){
    this.view = [innerWidth / this.widthQuota, this.view[1]];
  }
  onSelect(event: any) {
    console.log(event);

  }

  private refreshActivity() {
    this.multi = undefined

    var multi = []
    for(let i=0;i<10;i++) {
      multi.push({
        "name": i*50,
        "series": []
      })
    }

    if (this.activity !== undefined) {

      for (let act of this.activity) {
        if (act.sessions !== undefined && act.day !== undefined) {
          for(let session of act.sessions) {
            if (session.activity !== undefined) {
              if (session.activity.zones !== undefined) {
                for (let zone of session.activity.zones) {
                  if (zone.type === 'power') {
                      for (let bucket of zone.distribution_buckets) {
                          for (let mul of multi) {
                            if (bucket.min == mul.name) {
                               let weekNo = this.epr.getWeekNumber(act.day)

                                var fd: any = undefined
                                for (let series of mul.series) {
                                  // @ts-ignore
                                  if (series.name === weekNo) {
                                    fd = series
                                  }
                                }
                                if (fd === undefined) {
                                  fd = {
                                    name: weekNo,
                                    value: Math.round(bucket.time / 60)
                                  }
                                  // @ts-ignore
                                  mul.series.push(fd)
                                } else {
                                  fd.value = fd.value + Math.round(bucket.time / 60)
                                }

                            }
                          }
                      }
                  }
                }
              }
            }
          }
        }

      }
    }
    this.multi = multi
    // Now get results for specific week
    var week = this.epr.getWeekNumber(new Date())
    if (!this.thisWeek) week = week-1
    this.getWeek(week)
  }
  getWeek(weekNo : number) {
    this.single = undefined
    this.totalTime = 0
    let single: any[] = []
    if (this.multi !== undefined) {
      for (let bar of this.multi) {
        var singleBar: any = {
          name: bar.name
        }
        for (let wk of bar.series) {
          if (wk.name === weekNo) {
            singleBar.value = wk.value
            this.totalTime = this.totalTime + wk.value
          }
        }
        single.push(singleBar)
      }
    }
    this.single = single
  }
  onResize(event: any) {
    this.view = [event.target.innerWidth / this.widthQuota, this.view[1]];
  }
  round(val : number | undefined) {
    if (val == undefined) return undefined
    return Math.round(val)
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
  }
}
