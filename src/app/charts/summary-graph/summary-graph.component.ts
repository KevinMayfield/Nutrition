import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Color, LegendPosition, ScaleType} from "@swimlane/ngx-charts";
import {EPRService} from "../../service/epr.service";
import {ActivityDay, ActivitySession} from "../../models/activity-day";
import {hrZone} from "../../models/person";
import {StravaService} from "../../service/strava.service";
import {ActivityType} from "../../models/activity-type";


@Component({
  selector: 'app-summary-graph',
  templateUrl: './summary-graph.component.html',
  styleUrls: ['./summary-graph.component.scss']
})
export class SummaryGraphComponent implements OnChanges {

  activity: ActivityDay[] = []

  @Input()
  type : string = 'kcal'

  @Input()
  widthQuota: number = 1.1;

  @Input() set dayActivity(activity: ActivityDay[]) {
    this.activity = activity
    this.refreshActivity()
  }
  @Input()
  zoneHR: hrZone | undefined

  calories: any[] | undefined;
  trimp: any[] | undefined;
  tss: any[] | undefined;

 // view: [number, number] = [800, 300];

  colorScheme: Color = {

      domain: [ '#7aa3e5','#5AA454','#C7B42C','#A10A28'],
    group: ScaleType.Ordinal, name: "", selectable: false
  }
  colorNeutral: Color = {
    domain: [
      'lightblue'
    ], group: ScaleType.Ordinal, name: "", selectable: false
  }
  colorTrimp: Color = {
    domain: [
      'lightblue'
    ], group: ScaleType.Ordinal, name: "", selectable: false
  }
  colorTSS: Color = {
    domain: [
      'lightblue'
    ], group: ScaleType.Ordinal, name: "", selectable: false
  }

  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  showXAxisLabel = false;
  xAxisLabel = 'Range';
  showYAxisLabel = true;
  yAxisLabel = 'kcal';
  legendPosition: LegendPosition = LegendPosition.Below;

  constructor(
      private epr: EPRService,
      private strava: StravaService){
  //  this.view = [innerWidth / this.widthQuota, this.view[1]];
  }
  onSelect(event: any) {


  }
/*
  @HostListener('activity') logChange() {
    /// NOt working at mo
    console.log('HL changed');
    console.log(this.activity)
  }
*/
  refreshActivity() {
    this.calories = undefined
    this.trimp = undefined
    this.tss = undefined
    var calories: any[] = []
    var trimp: any[] = []
    var tss: any[] = []
    this.colorTrimp.domain = []
    this.colorTSS.domain = []
    if (this.activity !== undefined) {
      var day = 0;
      for (let act of this.activity) {
        var entryCalories = {
          "name": this.date(day),
          "series": []
        }
        var entryTrimp = {
          "name": this.date(day),
          "value": 0
        }
        var entryTss = {
          "name": this.date(day),
          "value": 0
        }
        for (let f=0;f<4;f++) {
          let ser :any = {
            name: 'Heart Rate based Load Zone ' + (f+1),
            value: 0,
            extra: {
              session: []
            }
          }
          // @ts-ignore
          entryCalories.series.push(ser)
        }
        for (let session of act.sessions) {
          if (session.activity != undefined && session.activity.trimp !== undefined) {
            entryTrimp.value += session.activity.trimp
          }
          if (session.activity != undefined && session.activity.np !== undefined) {
            entryTss.value += this.epr.stressTraining(session.activity)
          }
          let zone = this.getZone(session)
          var ent = entryCalories.series[zone-1]
           if (session.activity !== undefined && session.activity.kcal !== undefined) {
             // @ts-ignore
             ent.value = ent.value + Math.round(session.activity.kcal)
             // @ts-ignore
             ent.extra.session.push(session)
           }
        }
        calories.push(entryCalories)
        this.colorTrimp.domain.push(this.epr.getTrimpColour(entryTrimp.value))
        this.colorTSS.domain.push(this.epr.getTSSColour(entryTss.value))
        trimp.push(entryTrimp)
        tss.push(entryTss)
        day++
      }

      this.calories = calories
      this.trimp = trimp
      this.tss = tss
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // @ts-ignore
    if(changes.activity){
      console.log('ngOnChanges');

    }
  }
  getZone(session: ActivitySession) {
    let zone = this.epr.getHRZone()
    if (zone == undefined) return 0;
    if (session.activity == undefined) return 1;
    if (session.activity.trimp !== undefined) {
     return this.epr.getTrimpZone(session.activity.trimp)
    }
    return 1
    /*
    if (session.activity.average_heartrate == undefined) return 1
    // @ts-ignore
    if (session.activity.average_heartrate < zone.z1?.min) return 1
    // @ts-ignore
    if (session.activity.average_heartrate < zone.z2?.min) return 1
    // @ts-ignore
    if (session.activity.average_heartrate < zone.z3?.min) return 2
    // @ts-ignore
    if (session.activity.average_heartrate < zone.z4?.min) {

      return 3
    }
    // @ts-ignore
    if (session.activity.average_heartrate < zone.z5?.min) {
      return 4
    }
    return 5

     */
  }
  dayOfWeek(number: number) {
    var now = this.strava.getToDate();
    var from = this.strava.getToDate();
    from.setDate(now.getDate() - this.strava.duration + number );
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return days[ from.getDay() ];
  }
  date(number: number) {
    var now = this.strava.getToDate();
    var from = this.strava.getToDate();
    from.setDate(now.getDate() - this.strava.duration + number );
    return from.toISOString().split('T')[0];
  }
  duration(time: number ) {
    return this.epr.duration(time)
  }
  pizza(kcal: number | undefined) {
    return this.epr.pizza(kcal)
  }
  getType(type: ActivityType | undefined) {
    return this.strava.getType(type)
  }

  round(val : number | undefined) {
    if (val == undefined) return undefined
    return Math.round(val)
  }
 /* onResize(event: any) {
    this.view = [event.target.innerWidth / this.widthQuota, this.view[1]];
  }

  */

}
