import {Component, Input} from '@angular/core';
import {ActivityDay, ActivitySession} from "../../models/activity-day";
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
  templateUrl: './weekly-graph.component.html',
  styleUrls: ['./weekly-graph.component.scss']
})
export class WeeklyGraphComponent {
  activitiesWeek : ActivityWeek[] = []

  @Input()
  activity: ActivityDay[] | undefined

  @Input()
  widthQuota: number = 1.35;

  @Input() set dayActivity(activity: ActivityDay[]) {

    this.activity = activity
    this.refreshActivity()
  }
  @Input()
  zoneHR: hrZone | undefined

  stacked: any[] | undefined;
  single: any[] | undefined;

  viewSingle: [number, number] = [800, 200];
  viewStacked: [number, number] = [800, 300];

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

  constructor(
      private epr: EPRService,
      private strava: StravaService){
      this.viewSingle = [innerWidth / this.widthQuota, this.viewSingle[1]];
     this.viewStacked = [innerWidth / this.widthQuota, this.viewStacked[1]];
  }
  onSelect(event: any) {
    console.log(event);
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
      this.single = undefined
      this.colorSingle.domain = []
      var stacked = []
      var single = []
      var domain = []

      for (let wk of this.activitiesWeek) {
        // @ts-ignore
        let isoDate = this.getSundayFromWeekNum(wk.week)
        let iso= isoDate.toLocaleDateString()

        // @ts-ignore
        var entry = {"name": wk.week + ' ' + iso,
          "series": []
        }
        for (let f=0;f<5;f++) {
          let ser = {
            name: (f+1),
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

        var entrySingle = {"name": wk.week + ' ' + iso,value: 0,
          'extra': {
              'wk': wk
          }
        }
        // @ts-ignore
        let diffDays =this.epr.getDateAbs(new Date()) - this.epr.getDateAbs(this.getSundayFromWeekNum(wk.week))
        if (diffDays > 7) {
          entrySingle.value = Math.round(wk.kcal / 7)
        } else {
          if (+diffDays > 0) entrySingle.value = Math.round(wk.kcal / diffDays)
        }
        single.push(entrySingle)
        let avg_dur = Math.round(wk.duration / (7 *60))
        if (avg_dur < 20) {  domain.push('lightgrey') }
        else if (avg_dur < 40 ) { domain.push('lightblue') }
        else if (avg_dur < 60 ) {  domain.push('lightgreen') }
        else if (avg_dur < 240 ) {   domain.push('lightsalmon') }
        else  {   domain.push('lightpink') }
      }
      this.stacked  = stacked
      this.single  = single
      this.colorSingle.domain = domain
    }
  }

  onResize(event: any) {
    this.viewSingle = [event.target.innerWidth / this.widthQuota, this.viewSingle[1]];
    this.viewStacked = [event.target.innerWidth / this.widthQuota, this.viewStacked[1]];
  }

  getWeekNumber(d : Date) {
    // Copy date so don't modify original
    let onejan = new Date(d.getFullYear(), 0, 1);
    let week = Math.ceil((this.epr.getDateAbs(d) - this.epr.getDateAbs(onejan) + onejan.getDay() + 1) / 7);
    // Return array of year and week number
    return week;
  }
  getSundayFromWeekNum(weekNum : number) {
    var sunday = new Date(new Date().getFullYear(), 0, (1 + (weekNum - 1) * 7));
    while (sunday.getDay() !== 0) {
      sunday.setDate(sunday.getDate() + 1);
    }
    return sunday;
  }

  getZone(activity: SummaryActivity) {
    let zone = this.epr.person.hrzones
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
  round(val : number | undefined) {
    if (val == undefined) return undefined
    return Math.round(val)
  }
  pizza(kcal: number | undefined) {
    return this.epr.pizza(kcal)
  }
  /*

     if (activity.max_heartrate !== undefined && (this.activitiesWeek[week].hr_max === undefined || this.activitiesWeek[week].hr_max < activity.max_heartrate)) {
                      this.activitiesWeek[week].hr_max = activity.max_heartrate
                  }
                this.activitiesWeek[week].avg_duration = ((this.activitiesWeek[week].avg_duration * this.activitiesWeek[week].num_activities) + activity.elapsed_time) / (this.activitiesWeek[week].num_activities + 1)
                this.activitiesWeek[week].avg_kcal = ((this.activitiesWeek[week].avg_kcal * this.activitiesWeek[week].num_activities) + activity.kcal) / (this.activitiesWeek[week].num_activities + 1)
                if (this.activityArray[this.strava.duration - diffDays].duration ===0 ) {
                    this.activitiesWeek[week].num_activities = 1 + this.activitiesWeek[week].num_activities
                }

                this.dataSourceWeek = new MatTableDataSource<activityWeek>(this.activitiesWeek)

   */
}
