import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ActivityDay} from "../../models/activity-day";
import {hrZone} from "../../models/person";
import {Color, ScaleType} from "@swimlane/ngx-charts";
import {EPRService} from "../../service/epr.service";
import {StravaService} from "../../service/strava.service";
import {SummaryActivity} from "../../models/summary-activity";

class ActivityWeek {
  week?: number;
  duration: number = 0;
  kcal: number = 0;
  num_activities: number = 0;
  zones: DaySummary[] =[]
}

class DaySummary {
  kcal?: number = 0;
  duration: number = 0;
  zone?: number;
  num_activities?: number = 0;
}

@Component({
  selector: 'app-weekly-graph',
  styleUrls: ['./weekly-graph.component.scss'],
  templateUrl: './weekly-graph.component.html'
})
export class WeeklyGraphComponent implements OnInit {

  activitiesWeek : ActivityWeek[] = []

  @Input()
  activity: ActivityDay[] | undefined

  @Input()
  widthQuota: number = 1;

  // From original power summary display
  multiHR: any[] | undefined;
  multiPWR: any[] | undefined;
  yScaleMax =0;


  @Input() set dayActivity(activity: ActivityDay[]) {

    this.activity = activity
    this.refreshActivity()
  }
  @Input()
  zoneHR: hrZone | undefined

  stacked: any[] | undefined;

  viewHRPie:  [number, number] = [700, 200];
  viewPWRPie:  [number, number] = [800, 200];

  colorFTP: Color = {
    domain: this.epr.getFTPColours(),
    group: ScaleType.Ordinal,
    name: "",
    selectable: false
  }

  colorStacked: Color = {
    domain: [
      'lightgrey', 'lightblue', 'lightgreen', 'lightsalmon', 'lightpink'
    ], group: ScaleType.Ordinal, name: "", selectable: false
  }

  colorSingle: Color = {
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
  xAxisLabel = 'Week';
  showYAxisLabel = true;
  yAxisLabel = 'kcal';

  showLabels: boolean = false;
  isDoughnut: boolean = true;
  legendPosition: string = 'below';

  constructor(
      private epr: EPRService,
      private strava: StravaService){
      this.viewHRPie = [innerWidth / this.widthQuota, this.viewHRPie[1]];
      this.viewPWRPie = [innerWidth / this.widthQuota, this.viewPWRPie[1]];
  }
  onSelect(event: any) {
    console.log(event);
  }

  private refreshPowerActivity() {
    this.multiPWR = undefined

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
    this.multiPWR = multi
  }

  private refreshHRActivity() {
    this.multiHR = undefined

    this.yScaleMax = 0
    var multi = []
    var zones = this.epr.getHRZone()
    if (zones!== undefined) {

      // @ts-ignore
      multi.push({name : zones.z1.min , series: []})
      // @ts-ignore
      multi.push({name : zones.z2.min , series: []})
      // @ts-ignore
      multi.push({name : zones.z3.min , series: []})
      // @ts-ignore
      multi.push({name : zones.z4.min , series: []})
      // @ts-ignore
      multi.push({name : zones.z5.min , series: []})


      if (this.activity !== undefined) {

        for (let act of this.activity) {
          if (act.sessions !== undefined && act.day !== undefined) {
            for (let session of act.sessions) {
              if (session.activity !== undefined) {
                if (session.activity.zones !== undefined) {
                  for (let zone of session.activity.zones) {
                    if (zone.type === 'heartrate') {
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
    }
    this.multiHR = multi
  }
  refreshActivity() {

    this.activitiesWeek = []
    if (this.activity !== undefined) {
      var sortedActivity: ActivityDay[] = this.activity.sort((n1,n2) => {
        // @ts-ignore
        if (n1.day > n2.day) {
          return 1;
        }

        // @ts-ignore
        if (n1.day < n2.day) {
          return -1;
        }
        return 0;
      });

      for (let activityDay of sortedActivity) {
        for (let session of activityDay.sessions) {
          if (session.activity !== undefined) {
            let exercise = session.activity
            if (activityDay.day !== undefined) {
              let weekNo = this.getWeekNumber(activityDay.day)
              var week: ActivityWeek | undefined = undefined;
              for (let wk of this.activitiesWeek) {
                if (wk.week === weekNo) week = wk
              }
              if (week == undefined) {
                // @ts-ignore
                week = {
                  zones: [],
                  duration: exercise.elapsed_time,
                  kcal: 0,
                  num_activities: 1,
                  week: weekNo
                }
                if (exercise.kcal !== undefined) week.kcal = exercise.kcal
                for(let f=0;f<5;f++) {
                   let daySummary: DaySummary = {
                     zone: (f+1),
                     kcal: 0,
                     duration: 0,
                     num_activities:0
                   }
                   week.zones.push(daySummary)
                }
                this.activitiesWeek.push(week)
              } else {
                week.duration = week.duration + exercise.elapsed_time
                if (exercise.kcal !== undefined) week.kcal = week.kcal + exercise.kcal
                week.num_activities = (week.num_activities + 1)
              }
              let zone = this.getZone(exercise)
              for (let day of week.zones) {
                if (day.zone == zone) {

                  // @ts-ignore
                  if (exercise.kcal !== undefined) day.kcal = day.kcal + exercise.kcal

                  day.duration = day.duration + exercise.elapsed_time
                  // @ts-ignore
                  day.num_activities = (+day.num_activities + 1)
                }
              }
            } else {
          //    console.log(exercise)
            }
          }
        }
      }
      this.stacked = undefined

      this.colorSingle.domain = []
      var stacked = []

      var domain = []

      this.refreshPowerActivity()
      this.refreshHRActivity()

      for (let wk of this.activitiesWeek) {
        // @ts-ignore
        let isoDate = this.getSundayFromWeekNum(wk.week)
        let iso= isoDate.toLocaleDateString()

        // @ts-ignore
        var entry = {"name": wk.week + ' ' + iso,
          "series": [],
          "pwr": [],
          "hr": []
        }
        for (let f=0;f<5;f++) {
          let ser = {
            name: 'Heart rate Zone '+(f+1),
            value: 0,
            extra: {
              wk: {}
            }
          }
          // @ts-ignore
          entry.series.push(ser)
        }
        for (let zone of wk.zones) {

          if (zone.zone !== undefined) {
            var ent = entry.series[zone.zone - 1]
            if (zone.kcal !== undefined) {
              // @ts-ignore
              ent.value = ent.value + Math.round(zone.kcal)
              // @ts-ignore
              ent.extra.wk = zone

            }
          }
        }
        stacked.push(entry)

        let avg_dur = Math.round(wk.duration / (7 *60))
        if (avg_dur < 20) {  domain.push('lightgrey') }
        else if (avg_dur < 40 ) { domain.push('lightblue') }
        else if (avg_dur < 60 ) {  domain.push('lightgreen') }
        else if (avg_dur < 240 ) {   domain.push('lightsalmon') }
        else  {   domain.push('lightpink') }
      }

      for (let stack of stacked) {
        let week = +stack.name.split(' ')[0]
        let wkPower = this.getPWRWeek(week)
        stack.pwr = []
        wkPower.forEach((value, index) => {
          // @ts-ignore
          stack.pwr.push({
            name: 'Power Zone '+ (index+1),
            value: value.value
          })
        });
        let wkHR = this.getHRWeek(week)
        stack.hr = []
        wkHR.forEach((value, index) => {
          // @ts-ignore
          stack.hr.push({
            name: 'Heart rate Zone '+ (index+1),
            value: value.value
          })
        });
      }


      this.stacked  = stacked

      this.colorSingle.domain = domain
    }
  }

  onResize(event: any) {
    this.viewHRPie = [event.target.innerWidth / this.widthQuota, this.viewHRPie[1]];
    this.viewPWRPie = [event.target.innerWidth / this.widthQuota, this.viewPWRPie[1]];
  }

  getWeekNumber(d : Date) {
    return this.epr.getWeekNumber(d);
  }
  getSundayFromWeekNum(weekNum : number) {
    var sunday = new Date(this.strava.getToDate().getFullYear(), 0, (1 + (weekNum - 1) * 7));
    while (sunday.getDay() !== 0) {
      sunday.setDate(sunday.getDate() + 1);
    }
    return sunday;
  }

  getZone(activity: SummaryActivity) {
    let zone = this.epr.getHRZone()
    if (zone == undefined) return 0;
    if (activity == undefined) return 1;

    if (activity.average_heartrate == undefined) return 1
    // @ts-ignore
    if (activity.average_heartrate < zone.z1?.min) return 1
    // @ts-ignore
    if (activity.average_heartrate < zone.z2?.min) return 1
    // @ts-ignore
    if (activity.average_heartrate < zone.z3?.min) return 2
    // @ts-ignore
    if (activity.average_heartrate < zone.z4?.min) {
      return 3
    }
    // @ts-ignore
    if (activity.average_heartrate < zone.z5?.min) {
      return 4
    }
    return 5
  }

  getPWRWeek(weekNo : number) {

    let single: any[] = []
    if (this.multiPWR !== undefined) {
      for (let bar of this.multiPWR) {
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
          }
        }
        single.push(singleBar)
      }
    }
    return single
  }
  getHRWeek(weekNo : number) {

    let single: any[] = []
    if (this.multiHR !== undefined) {
      for (let bar of this.multiHR) {
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
          }
        }
        single.push(singleBar)
      }
    }
    return single
  }

  round(val : number | undefined) {
    if (val == undefined) return undefined
    return Math.round(val)
  }
  pizza(kcal: number | undefined) {
    return this.epr.pizza(kcal)
  }
  duration(time: number ) {
    return this.epr.duration(time)
  }

  ngOnInit(): void {
    if (this.epr.person !== undefined && this.epr.person.ftp !== undefined) {
      this.colorFTP.domain = this.epr.getFTPColours()
    }
  }

}
