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
export class SummaryGraphComponent {

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

  caloriesData: any[] | undefined;

  XAxis: any[] | undefined;
  trimpData: any[] | undefined
  tssData: any[] | undefined

  colorScheme =  [ '#7aa3e5','#5AA454','#C7B42C','#A10A28']

  constructor(
      private epr: EPRService,
      private strava: StravaService){
  //  this.view = [innerWidth / this.widthQuota, this.view[1]];
  }
  onSelect(event: any) {


  }

  refreshActivity() {
    this.caloriesData = undefined
    this.tssData = undefined
    this.trimpData = undefined
    this.XAxis = undefined

    var calories: any[] = []
    var trimp: number[] = []
    var tss: number[] = []


    var XAxis : any = [
      {
        data: []
      }
    ]
    if (this.activity !== undefined) {
      var day = 0;
      for (let act of this.activity) {
        XAxis[0].data.push(this.date(day))

        var entryTrimp = 0
        var entryTss=  0

        var entryCalories :number[] = []
        for (let f=0;f<4;f++) {
          entryCalories.push(0)
        }
        for (let session of act.sessions) {
          if (session.activity != undefined && session.activity.trimp !== undefined) {
            entryTrimp += session.activity.trimp
          }
          if (session.activity != undefined && session.activity.np !== undefined) {
            entryTss += this.epr.stressTraining(session.activity)
          }
          let zone = this.getZone(session)
           if (session.activity !== undefined && session.activity.kcal !== undefined) {
             entryCalories[zone-1] += Math.round(session.activity.kcal)
           }
        }
        calories.push(entryCalories)
        trimp.push(entryTrimp)
        tss.push(entryTss)
        day++
      }

      var trimpData :any = [
        {
          name: 'Trimp',
          stack: 'Trimp',
          type: 'bar',
          data: []
        }
      ]
      trimp.forEach(value => {
        trimpData[0].data.push({
          value: value,
          itemStyle: {
            color: this.epr.getTrimpColour(value)
          }
        })
      })
      this.trimpData = trimpData

      var tssData :any = [
        {
          name: 'TSS',
          stack: 'TSS',
          type: 'bar',
          data: []
        }
      ]
      tss.forEach(value => {
        tssData[0].data.push({
          value: value,
          itemStyle: {
            color: this.epr.getTSSColour(value)
          }
        })
      })
      this.tssData = tssData
      this.XAxis = XAxis

      var caloriesData :any[] = [
      ]

       for (let f=0;f<4;f++) {
          let ser :any = {
            name: 'Heart Rate based Load Zone ' + (f+1),
            color: this.colorScheme[f],
            stack: 'calories',
            type: 'bar',
            data:[]
          }
          caloriesData.push(ser)
        }
      calories.forEach(value=>{
        for (let f=0;f<4;f++) {
          caloriesData[f].data.push(value[f])
        }
      })


      this.caloriesData = caloriesData
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

  }

  date(number: number) {
    var now = this.epr.getToDate();
    var from = this.epr.getToDate();
    from.setDate(now.getDate() - this.epr.duration + number );
    return from.toISOString().split('T')[0];
  }

  pizza(kcal: number | undefined) {
    return this.epr.pizza(kcal)
  }
  getType(type: ActivityType | undefined) {
    return this.strava.getType(type)
  }

}
