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
  week : number = 0;


  @Input() set dayActivity(activity: ActivityDay[]) {

    this.activity = activity
    this.refreshActivity()
  }
  @Input()
  zoneHR: hrZone | undefined

  multi: any[] | undefined;
  single: any[] | undefined;
  totalTime = 0;

  view: [number, number] = [800, 200];
  @Input()
  widthQuota: number = 1.1;

  colorScheme: Color = {
    domain: this.epr.getFTPColours(),
    group: ScaleType.Ordinal,
    name: "",
    selectable: false
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
  yScaleMax= 0;

  constructor(
      private epr: EPRService,
      private strava: StravaService){
    this.view = [innerWidth / this.widthQuota, this.view[1]];
  }
  onSelect(event: any) {
    console.log(event);

  }

  getWeekDate()  {
    var enddate = this.strava.getToDate()
    return enddate.setDate(enddate.getDate() + this.week*7)
  }
  getWeekNum()  {

    var week = this.epr.getWeekNumber(this.strava.getToDate()) + this.week
    return week
  }

  private refreshActivity() {
    this.multi = undefined
    this.single = undefined
    this.yScaleMax = 0
    var multi = []
    var zones = this.epr.getPWRZone()
    multi.push({name : zones?.z1.min , series: []})
    multi.push({name : zones?.z2.min , series: []})
    multi.push({name : zones?.z3.min , series: []})
    multi.push({name : zones?.z4.min , series: []})
    multi.push({name : zones?.z5.min , series: []})
    multi.push({name : zones?.z6.min , series: []})
    multi.push({name : zones?.z7.min , series: []})

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
    var week = this.epr.getWeekNumber(this.strava.getToDate())

    this.getWeek(week + this.week)
  }
  getWeek(weekNo : number) {

    this.totalTime = 0
    let single: any[] = []
    if (this.multi !== undefined) {
      for (let bar of this.multi) {
        var singleBar: any = {
          name: bar.name,
          value: 0
        }
        for (let wk of bar.series) {
          if (this.yScaleMax<wk.value) this.yScaleMax = wk.value
          if (wk.name === weekNo ) {
            if (wk.value !== undefined) {
              singleBar.value = wk.value
            }
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
  duration(time: number ) {
    return this.epr.duration(time)
  }
  ngOnInit(): void {
    if (this.epr.person !== undefined && this.epr.person.ftp !== undefined) {
      this.colorScheme.domain = this.epr.getFTPColours()
    }
    this.view = [innerWidth / this.widthQuota, this.view[1]]
  }
}
