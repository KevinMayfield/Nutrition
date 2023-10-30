import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Color, ScaleType} from "@swimlane/ngx-charts";
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
  @Input()
  activity: ActivityDay[] | undefined

  @Input()
  widthQuota: number = 1.1;

  @Input() set dayActivity(activity: ActivityDay[]) {

    this.activity = activity
    this.refreshActivity()
  }
  @Input()
  zoneHR: hrZone | undefined

  single: any[] | undefined;

 // view: [number, number] = [800, 300];

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
  showXAxisLabel = false;
  xAxisLabel = 'Range';
  showYAxisLabel = true;
  yAxisLabel = 'kcal';

  constructor(
      private epr: EPRService,
      private strava: StravaService){
  //  this.view = [innerWidth / this.widthQuota, this.view[1]];
  }
  onSelect(event: any) {
    console.log(event);

  }
/*
  @HostListener('activity') logChange() {
    /// NOt working at mo
    console.log('HL changed');
    console.log(this.activity)
  }
*/
  refreshActivity() {
    this.single = undefined
    var single = []

    if (this.activity !== undefined) {
      var day = 0;
      for (let act of this.activity) {
        var entry = {
          "name": this.date(day),
          "series": []
        }
        for (let f=0;f<5;f++) {
          let ser = {
            name: (f+1),
            value: 0,
            extra: {
              session: []
            }
          }
          // @ts-ignore
          entry.series.push(ser)
        }
        for (let session of act.sessions) {
          let zone = this.getZone(session)
          var ent = entry.series[zone-1]
           if (session.activity !== undefined && session.activity.kcal !== undefined) {
             // @ts-ignore
             ent.value = ent.value + Math.round(session.activity.kcal)
             // @ts-ignore
             ent.extra.session.push(session)
           }
        }
        single.push(entry)
        day++
      }
      this.single = single
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
