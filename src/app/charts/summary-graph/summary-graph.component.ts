import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
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
  yAxis : any =
      [
        {
          type: 'value',
          name: 'Score',
          position: 'left',
          alignTicks: false
        },
        {
          type: 'value',
          name: 'Acute Load',
          position: 'right',
          alignTicks: false,

        }
      ]

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
        for (let f=0;f<5;f++) {
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

      // Hert inc ACL
      var trimpData :any = [
      ]

      for (let f=0;f<4;f++) {
        let ser :any = {
          name: 'Recovery Level ' + (f+1),
          color: this.epr.color[f+1],
          stack: 'trimp',
          type: 'bar',
          data:[]
        }
        trimp.forEach(value => {
            if (this.epr.getTrimpRecoveryZone(value) === f) {
              ser.data.push({
                value: value
              })
            } else {
              ser.data.push({
                value: 0
              })
            }
          }
        )
        trimpData.push(ser)
      }

      let ser :any = {
        name: 'Acute Load',
        type: 'line',
        yAxisIndex: 1,
        data:[]
      }
      trimp.forEach((value, index) => {
        var sum: number | undefined = undefined
        var start = index - 7
        if (start >= 0) {
          sum = 0
          for (var i = start; i <= index; i++) {
            sum += trimp[i]
          }
        }
          ser.data.push(sum)
      })



      trimpData.push(ser)
      this.trimpData = trimpData

      // Power inc ACL

      var tssData :any = []
      for (let f=0;f<4;f++) {
        let ser: any = {
          name: 'Recovery Level ' + (f + 1),
          color: this.epr.color[f + 1],
          stack: 'tss',
          type: 'bar',
          data: []
        }
        tss.forEach(value => {
          if (this.epr.getTSSRecoveryZone(value) === f) {
            ser.data.push({value: value})
          } else {
            ser.data.push({value: 0})
          }
        })
        tssData.push(ser)
      }
      ser = {
        name: 'Acute Load',
        type: 'line',
        yAxisIndex: 1,
        data:[]
      }
      tss.forEach((value, index) => {
        var sum: number | undefined = undefined
        var start = index - 7
        if (start >= 0) {
          sum = 0
          for (var i = start; i <= index; i++) {
            sum += tss[i]
          }
        }
        ser.data.push(sum)
      })


      tssData.push(ser)

      this.tssData = tssData
      // ACL End
      this.XAxis = XAxis

      // Calories inc ACL
      var caloriesData :any[] = [
      ]

       for (let f=0;f<5;f++) {
          let ser :any = {
            name: 'Intensity Zone ' + (f+1),
            color: this.epr.color[f],
            stack: 'calories',
            type: 'bar',
            data:[]
          }
          caloriesData.push(ser)
        }
      calories.forEach(value=>{
        for (let f=0;f<5;f++) {
          caloriesData[f].data.push(value[f])
        }
      })
      var serC : any = {
        name: 'Acute Load',
        type: 'line',
        yAxisIndex: 1,
        data:[]
      }
      calories.forEach((value, index) => {
        var sum: number | undefined = undefined
        var start = index - 7
        if (start >= 0) {
          sum = 0
          for (var i = start; i <= index; i++) {
            calories[i].forEach((entry : any) => {
                sum += entry
            })
          }
        }
        serC.data.push(sum)
      })
      caloriesData.push(serC)
      this.caloriesData = caloriesData
    }
  }

  getZone(session: ActivitySession) {
    let zone = this.epr.getHRZone()
    if (zone == undefined) return 0;
    if (session.activity == undefined) return 1;
    if (session.activity.trimp !== undefined) {
     return this.epr.getIntensityZone(session.activity.trimp, session.activity.elapsed_time)
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
