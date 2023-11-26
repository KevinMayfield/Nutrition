import { Component,Input, ViewChild} from '@angular/core';
import {Observations} from "../../models/observations";
import {EPRService} from "../../service/epr.service";
import {MatSort, Sort} from "@angular/material/sort";
import {LiveAnnouncer} from "@angular/cdk/a11y";
import {SummaryActivity} from "../../models/summary-activity";

@Component({
  selector: 'app-body-measures',
  templateUrl: './body-measures.component.html',
  styleUrls: ['./body-measures.component.scss']
})
export class BodyMeasuresComponent {


  private measures :Observations[] = []
  private activity: SummaryActivity[] = []

  weightData: any[] = [];
  bodyComposition: any[] = [];

  spo2Data: any[] = [];
  hba1cData: any[] = []

  steps: any[] = [];
  bpSeries :any[] = []

  @Input() set observations(measure: Observations[]) {
    this.measures = measure
    this.refreshActivity()
  }
  @Input() set activities(summaryActivities: SummaryActivity[]) {
    this.activity = summaryActivities
    this.refreshActivity()
  }

  colorSeries =  [ '#7aa3e5','#5AA454','#CFC0BB', '#E44D25',  '#a8385d', '#aae3f5']

  weightMin= 99999;
  weightMax= 0;
  muscleMin= 99999;
  muscleMax= 0;
  fatMin= 99999;
  fatMax= 0;
  boneMin= 99999;
  boneMax= 0;
  hydrationMin= 99999;
  hydrationMax= 0;

  avgWeight = 0

  scaleMin = 9999;
  scaleMax = 0;

  spo2Min = 9999;
  spo2Max = 0;
  hba1cMin = 9999;
  hba1cMax = 0;

  @ViewChild('HbA1cSort') HbA1cSort: MatSort | null | undefined;
  spo2PanelOpenState: boolean = false;

  yAxisBodyComposition : any =
      [
        {
          type: 'value',
          name: 'Body Weight',
          position: 'left',
          alignTicks: false,
          axisLine: {
            show: true,
            lineStyle: {
              color: this.colorSeries[0]
            }
          },
          axisLabel: {
            formatter: '{value} Kg'
          }
        },
        {
          type: 'value',
          name: 'Fat Mass',
          position: 'right',
          alignTicks: false,
          axisLine: {
            show: true,
            lineStyle: {
              color: this.colorSeries[1]
            }
          },
          axisLabel: {
            formatter: '{value} Kg'
          }
        },
        {
          type: 'value',
          name: 'Muscle',
          position: 'right',
          alignTicks: true,
          show: false,
          axisLine: {
            show: false,
            lineStyle: {
              color: this.colorSeries[2]
            }
          },
          axisLabel: {
            formatter: '{value}'
          }
        },
        {
          type: 'value',
          name: 'Water',
          position: 'right',
          alignTicks: true,

          show: false,
          axisLine: {
            show: false,
            lineStyle: {
              color: this.colorSeries[3]
            }
          },
          axisLabel: {
            formatter: '{value}'
          }
        },
        {
          type: 'value',
          name: 'Bone',
          position: 'right',
          alignTicks: true,
          show: false,
          axisLine: {
            show: false,
            lineStyle: {
              color: this.colorSeries[4]
            }
          },
          axisLabel: {
            formatter: '{value}'
          }
        }
      ]
  bodyPanelOpenState = false;
  bpOption: any | undefined;

  constructor(public epr: EPRService,
              private _liveAnnouncer: LiveAnnouncer){

  }



  private refreshActivity() {


    this.bpSeries = []

    const spo2Data: any[] = [
        {
          symbolSize: 5,
          data: [],
          type: 'scatter',
          name: 'spo2'
        },
      {
        data: [],
        type: 'line',
        name: 'low'
      },
      {
        data: [],
        type: 'line',
        name: 'high'
      }
    ];
    const weightData: any[] = [
      {
        data: [],
        type: 'line',
        name: 'Body Mass',
        markPoint: {
          data: [
            { type: 'max', name: 'Max' },
            { type: 'min', name: 'Min' }
          ]
        },
        markLine: {
          data: [{ type: 'average', name: 'Avg' }]
        }
      }
    ];
    const bodyComposition: any[] = [
      {
        data: [],
        type: 'line',
        name: 'Body Mass',
        markLine: {
          data: [{ type: 'average', name: 'Avg' }]
        }
      },
      {
        data: [],
        type: 'line',
        yAxisIndex: 1,
        name: 'Fat Mass',
        markLine: {
          data: [{ type: 'average', name: 'Avg' }]
        }
      },
      {
        data: [],
        type: 'line',
        yAxisIndex: 2,
        name: 'Muscle Mass',
        markLine: {
          data: [{ type: 'average', name: 'Avg' }]
        }
      },
      {
        data: [],
        type: 'line',
        yAxisIndex: 3,
        name: 'Body Water',
        markLine: {
          data: [{ type: 'average', name: 'Avg' }]
        }
      },
      {
        data: [],
        type: 'line',
        yAxisIndex: 4,
        name: 'Bone Mass',
        markLine: {
          data: [{ type: 'average', name: 'Avg' }]
        }
      }
    ];


    this.steps = []
    var steps: any[]=[{
      data: [],
      type: 'bar',
      name: 'Steps'
    }]
    var hb1ac: any[] = [
      {
        data: [],
        type: 'line',
        name: 'Blood Glucose',
        markLine: {
          data: [{ type: 'average', name: 'Avg' }]
        }
      },
      {
        data: [],
        type: 'line',
        name: 'Blood Glucose (Pre Exercise)',
        markLine: {
          data: [{ type: 'average', name: 'Avg' }]
        }
      },
      {
        data: [],
        type: 'line',
        name: 'Blood Glucose (Post Excercise)',
        markLine: {
          data: [{ type: 'average', name: 'Avg' }]
        }
      }]

    var bpData : any[]= [
      {
        name: 'Systole',
        type: 'line',
        data: []
      },
      {
        name: 'Diastole',
        type: 'line',
        data: []
      }
    ]
    this.bpOption = undefined
    var bpOption :any = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line'
        }
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: []
      },
      yAxis: {
        scale: true
      },
      series: [
        {
          type: 'candlestick',
          encode: {
            x: 0,
            y: [1, 4, 3, 2]
          },
          data: []
        }
      ]
    }

    this.measures.forEach(observations => {
        if (observations.weight !== undefined) {
          if (observations.weight < this.weightMin) this.weightMin = observations.weight
          if (observations.weight > this.weightMax) this.weightMax = observations.weight

          const idata: any[] = []
          idata.push(observations.day.toISOString())
          idata.push(observations.weight)
          weightData[0].data.push(idata)
          bodyComposition[0].data.push(idata)

          if (observations.fat_mass !== undefined) {
            if (observations.fat_mass < this.fatMin) this.fatMin = observations.fat_mass
            if (observations.fat_mass > this.fatMax) this.fatMax = observations.fat_mass

            const idata: any[] = []
            idata.push(observations.day.toISOString())
            idata.push(observations.fat_mass)
            bodyComposition[1].data.push(idata)
          }
          if (observations.muscle_mass !== undefined) {
            if (observations.muscle_mass < this.muscleMin) this.muscleMin = observations.muscle_mass
            if (observations.muscle_mass > this.muscleMax) this.muscleMax = observations.muscle_mass


            const idata: any[] = []
            idata.push(observations.day.toISOString())
            idata.push(observations.muscle_mass)
            bodyComposition[2].data.push(idata)
          }
          if (observations.hydration !== undefined) {
            if (observations.hydration < this.hydrationMin) this.hydrationMin = observations.hydration
            if (observations.hydration > this.hydrationMax) this.hydrationMax = observations.hydration


            const idata: any[] = []
            idata.push(observations.day.toISOString())
            idata.push(observations.hydration)
            bodyComposition[3].data.push(idata)
          }

          if (observations.bone_mass !== undefined) {
            if (observations.bone_mass < this.boneMin) this.boneMin = observations.bone_mass
            if (observations.bone_mass > this.boneMax) this.boneMax = observations.bone_mass

            const idata: any[] = []
            idata.push(observations.day.toISOString())
            idata.push(observations.bone_mass)
            bodyComposition[4].data.push(idata)
          }
        }
      if (observations.glucose !== undefined && observations.glucose.val !== undefined) {
        if (observations.glucose.val < this.hba1cMin) this.hba1cMin = observations.glucose.val
        if (observations.glucose.val > this.hba1cMax) this.hba1cMax = observations.glucose.val
        const idata: any[] = []
        idata.push( observations.day.toISOString())
        idata.push(this.round1DP(observations.glucose.val))

        if (this.activity !== undefined && this.activity.length > 0) {
          const context = this.getObservationContext(observations)
          if (context !== undefined) {
            if (context === 'Pre Exercise') {
              hb1ac[1].data.push(idata)
            }
            if (context === 'Post Exercise') {
              hb1ac[2].data.push(idata)
            }
          }
        } else {
          hb1ac[0].data.push(idata)
        }
      }
      if (observations.spo2 !== undefined) {
        if (observations.spo2.avg !== undefined) {

          const idata: any[] = []
          idata.push( observations.day.toISOString())
          idata.push(observations.spo2.avg)
          spo2Data[0].data.push(idata)
        }
        if (observations.spo2.min !== undefined) {
          if (observations.spo2.min < this.spo2Min) this.spo2Min = observations.spo2.min

          const idata: any[] = []
          idata.push( observations.day.toISOString())
          idata.push(observations.spo2.min)
          spo2Data[1].data.push(idata)
        }
        if (observations.spo2.max !== undefined) {
          if (observations.spo2.max > this.spo2Max) this.spo2Max = observations.spo2.max

          const idata: any[] = []
          idata.push( observations.day.toISOString())
          idata.push(observations.spo2.max)
          spo2Data[2].data.push(idata)
        }
      }
      if (observations.diastolic !== undefined || observations.systolic !== undefined) {
        if (observations.diastolic !== undefined) {
          if (observations.diastolic < this.scaleMin) this.scaleMin = observations.diastolic

          const idata: any[] = []
          idata.push( observations.day.toISOString())
          idata.push(observations.diastolic)
          bpData[1].data.push(idata)
        }
        if (observations.systolic !== undefined) {
          if (observations.systolic > this.scaleMax) this.scaleMax = observations.systolic
          const idata: any[] = []
          idata.push( observations.day.toISOString())
          idata.push(observations.systolic)
          bpData[0].data.push(idata)
        }
      }

      if (observations.steps !== undefined) {
        const idata: any[] = []
        idata.push( observations.day.toISOString())
        idata.push(observations.steps)
        steps[0].data.push(idata)
      }
    })
    var sortedMeasure: Observations[] = this.measures.sort((n1,n2) => {

      if (n1.day > n2.day) {
        return 1;
      }

      // @ts-ignore
      if (n1.day < n2.day) {
        return -1;
      }
      return 0;
    });
    sortedMeasure.forEach(observations => {
      if (observations.diastolic !== undefined && observations.systolic !== undefined) {
        bpOption.xAxis.data.push(observations.day.toISOString())
        const idata : any[] = []
        idata.push(observations.diastolic)
        idata.push(observations.systolic)
        idata.push(observations.diastolic)
        idata.push(observations.systolic)
        var colour = '#5AA454'
        if (observations.systolic > 130) colour = '#C7B42C'
        if (observations.diastolic > 80) colour = '#C7B42C'
        if (observations.systolic > 135) colour = '#A10A28'
        if (observations.diastolic > 85) colour = '#A10A28'

        const data = {
          value: idata,
          itemStyle: {
            color: colour,
          }
        }
        bpOption.series[0].data.push(data)
      }
    })

    this.bpSeries = bpData
    this.bpOption = bpOption

    this.hba1cData = hb1ac
    this.steps = steps



    this.spo2Data = spo2Data

    this.weightData = weightData
    this.bodyComposition = bodyComposition
    this.yAxisBodyComposition[0].min = Math.floor(this.weightMin - 7)
    this.yAxisBodyComposition[0].max = Math.ceil(this.weightMax)

    this.yAxisBodyComposition[1].min = Math.floor(this.fatMin -2)
    this.yAxisBodyComposition[1].max = Math.ceil(this.fatMax + 5)

    this.yAxisBodyComposition[2].min = Math.floor(this.muscleMin - 11)
    this.yAxisBodyComposition[2].max = Math.ceil(this.muscleMax + 3)

    this.yAxisBodyComposition[3].min = Math.floor(this.hydrationMin - 7)
    this.yAxisBodyComposition[3].max = Math.ceil(this.hydrationMax + 4)

    this.yAxisBodyComposition[4].min = Math.floor(this.boneMin * 10) / 10
    this.yAxisBodyComposition[4].max = Math.ceil(1 + this.boneMax * 10  ) / 10


    this.avgWeight = this.round1DP(this.getAvgE(bodyComposition[0].data))
  }


  getLastE(data: any[]) {
    return this.epr.getLastE(data)
  }

  getMinE(data: any[]) {
    return this.epr.getMinE(data)
  }
  getMaxE(data: any[]) {
    return this.epr.getMaxE(data)
  }
  getAvgE(data: any[]) {
    return this.epr.getAvgE(data)
  }

  round1DP(value : number) {
    return Math.round(value * 10) / 10
  }
  round(value : number) {
    return Math.round(value )
  }


  getOK() {
    return this.epr.getOK()
  }
  getWarning() {
    return this.epr.getWarning()
  }
  getInfo() {
    return this.epr.getInfo()
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  getContext(measurement : any[]) {

      var result: string | undefined = undefined
      var measurementDate = new Date(measurement[0])
      if (measurementDate instanceof Date) {
        var contextDate: Date =measurementDate
        this.activity.forEach(activity => {
          var activityDate = new Date(activity.start_date)
          var activityEndDate = new Date(activityDate)
          activityEndDate.setMinutes(activityDate.getMinutes() + (activity.elapsed_time/60))
          //console.log(activity.elapsed_time/60)
          var diff = (activityDate.valueOf() - contextDate.valueOf()) / (1000 *60)
          if (activityDate > contextDate && diff > 0 && diff < 60) {
            result = 'Pre Exercise'
          }
          diff = (activityEndDate.valueOf() - contextDate.valueOf()) / (1000 *60)
          if (activityEndDate < contextDate &&  diff < 0 && diff > -60) {
            result = 'Post Exercise'
          }
          if (contextDate > activityDate && contextDate < activityEndDate) {
            result = 'During Exercice'
          }
        })
      } else { console.log('Not a date')}
      return result
  }
  getObservationContext(measurement : Observations) {
    var result: string | undefined = undefined
    var measurementDate = new Date(measurement.day)
    if (measurementDate instanceof Date) {
      var contextDate: Date =measurementDate
      this.activity.forEach(activity => {
        var activityDate = new Date(activity.start_date)
        var activityEndDate = new Date(activityDate)
        activityEndDate.setMinutes(activityDate.getMinutes() + (activity.elapsed_time/60))
        //console.log(activity.elapsed_time/60)
        var diff = (activityDate.valueOf() - contextDate.valueOf()) / (1000 *60)
        if (activityDate > contextDate && diff > 0 && diff < 60) {
          result = 'Pre Exercise'
        }
        diff = (activityEndDate.valueOf() - contextDate.valueOf()) / (1000 *60)
        if (activityEndDate < contextDate &&  diff < 0 && diff > -60) {
          result = 'Post Exercise'
        }
        if (contextDate > activityDate && contextDate < activityEndDate) {
          result = 'During Exercice'
        }
      })
    } else { console.log('Not a date')}
    return result
  }


}
