import { Component,Input, ViewChild} from '@angular/core';
import {Observations} from "../models/observations";
import {Color, LegendPosition, ScaleType} from "@swimlane/ngx-charts";
import { curveCatmullRom} from 'd3-shape';
import {EPRService} from "../service/epr.service";
import {MatSort, Sort} from "@angular/material/sort";
import {LiveAnnouncer} from "@angular/cdk/a11y";
import {MatTableDataSource} from "@angular/material/table";
import {LineChartSeries, LineSeries} from "../models/graphs";
import {SummaryActivity} from "../models/summary-activity";


@Component({
  selector: 'app-body-measures',
  templateUrl: './body-measures.component.html',
  styleUrls: ['./body-measures.component.scss']
})
export class BodyMeasuresComponent {


  measures :Observations[] = []
  activity: SummaryActivity[] = []

  weightData: any[] = [];
  bodyComposition: any[] = [];

  spo2: LineChartSeries[] | undefined
  spo2Data: any[] = [];
  hba1c: LineChartSeries[] | undefined

  hydration: LineChartSeries[] | undefined
  steps: LineSeries[] = [];
  bpSeries : any;
  @Input() set observations(measure: Observations[]) {
   // DEBUG  console.log('No. of measures = ' + measure.length)
    this.measures = measure
    this.refreshActivity()
  }
  @Input() set activities(activity: SummaryActivity[]) {
    this.activity = activity
  }

  showXAxisLabel = false;
  showYAxisLabel = true;
  timeline: boolean = false;
  colorSeries = {
    domain: [ '#7aa3e5','#5AA454','#CFC0BB', '#E44D25',  '#a8385d', '#aae3f5']
    , group: ScaleType.Ordinal, name: "", selectable: false
  };
  colorNeutral: Color = {
    domain: [
      '#7aa3e5'
    ], group: ScaleType.Ordinal, name: "", selectable: false
  }
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

  //curve = curveBasis
  curve = curveCatmullRom
  schemeType: ScaleType = ScaleType.Linear;
  legendPosition: LegendPosition = LegendPosition.Below;
  scaleMin = 9999;
  scaleMax = 0;
  bpReferenceLines: any[] = [];

  spo2Min = 9999;
  spo2Max = 0;

  // Blood glucose table
  dataSourceHbA1c: any;
  displayedColumnsHbA1c = ['date', 'time', 'value', 'context']
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
              color: this.colorSeries.domain[0]
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
              color: this.colorSeries.domain[1]
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
              color: this.colorSeries.domain[2]
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
              color: this.colorSeries.domain[3]
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
              color: this.colorSeries.domain[4]
            }
          },
          axisLabel: {
            formatter: '{value}'
          }
        }
      ]
  bodyPanelOpenState = false;

  constructor(public epr: EPRService,
              private _liveAnnouncer: LiveAnnouncer){

  }



  private refreshActivity() {

    this.hydration = []
    this.bpSeries = []
    this.spo2 = []
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
        }
      }
    ];
    const bodyComposition: any[] = [
      {
        data: [],
        type: 'line',
        name: 'Body Mass'
      },
      {
        data: [],
        type: 'line',
        yAxisIndex: 1,
        name: 'Fat Mass'
      },
      {
        data: [],
        type: 'line',
        yAxisIndex: 2,
        name: 'Muscle Mass'
      },
      {
        data: [],
        type: 'line',
        yAxisIndex: 3,
        name: 'Body Water',
      },
      {
        data: [],
        type: 'line',
        yAxisIndex: 4,
        name: 'Bone Mass'
      }
    ];



    this.steps = []
    var steps: LineSeries[]=[]
    var hb1ac: LineChartSeries[] = [
      {
        name: 'Blood Glucose',
        series: []
      }]

    var bp : LineChartSeries[]= [
      {
        name: 'Systole',
        series: []
      },
      {
        name: 'Diastole',
        series: []
      }
    ]
    var spo2 : LineChartSeries[]= [
      {
        name: 'Average',
        series: []
      },
      {
        name: 'Min',
        series: []
      }
      ,
      {
        name: 'Max',
        series: []
      }
    ]
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
      if (observations.glucose !== undefined) {
        let ent = {
          name: observations.day,
          value: observations.glucose.val
        }
        hb1ac[0].series.push(ent)
      }
      if (observations.spo2 !== undefined) {
        if (observations.spo2.avg !== undefined) {
          spo2[0].series.push({
            name: observations.day,
            value: observations.spo2.avg
          })
          const idata: any[] = []
          idata.push( observations.day.toISOString())
          idata.push(observations.spo2.avg)
          spo2Data[0].data.push(idata)
        }
        if (observations.spo2.min !== undefined) {
          if (observations.spo2.min < this.spo2Min) this.spo2Min = observations.spo2.min
          spo2[1].series.push({
            name: observations.day,
            value: observations.spo2.min
          })
          const idata: any[] = []
          idata.push( observations.day.toISOString())
          idata.push(observations.spo2.min)
          spo2Data[1].data.push(idata)
        }
        if (observations.spo2.max !== undefined) {
          if (observations.spo2.max > this.spo2Max) this.spo2Max = observations.spo2.max
          spo2[2].series.push({
            name: observations.day,
            value: observations.spo2.max
          })
          const idata: any[] = []
          idata.push( observations.day.toISOString())
          idata.push(observations.spo2.max)
          spo2Data[2].data.push(idata)
        }
      }
      if (observations.diastolic !== undefined || observations.systolic !== undefined) {
        if (observations.diastolic !== undefined) {
          if (observations.diastolic < this.scaleMin) this.scaleMin = observations.diastolic
          bp[1].series.push({
            name: observations.day,
            value: observations.diastolic
          })
        }
        if (observations.systolic !== undefined) {
          if (observations.systolic > this.scaleMax) this.scaleMax = observations.systolic
          bp[0].series.push({
            name: observations.day,
            value: observations.systolic
          })
        }
      }
      if (observations.steps !== undefined) {
        let ent = {
          name: observations.day,
          value: observations.steps
        }
        steps.push(ent)
      }
    })

    this.bpSeries = bp

    this.spo2 = spo2
    this.hba1c = hb1ac
    this.steps = steps

    this.dataSourceHbA1c = new MatTableDataSource<any>(this.hba1c[0].series.sort((a, b) => {
      if (a.name < b.name) {
        return 1;
      }

      if (a.name > b.name) {
        return -1;
      }
      return 0;
    }));

    this.spo2Data = spo2Data

    var sum = 0
    let referenceLines = []

    if (this.bpSeries.length > 0 && this.bpSeries[0].series !== undefined) {
      sum =0
      this.bpSeries[0].series.forEach((entry: any) => {
        sum += entry.value
      })
      referenceLines.push({
        name: 'Average Systolic',
        value: Math.round(sum / this.bpSeries[0].series.length)
      })
    }
    if (this.bpSeries.length > 1 && this.bpSeries[1].series !== undefined) {
      sum =0
      this.bpSeries[1].series.forEach((entry: any) => {
        sum += entry.value
      })
      referenceLines.push({
        name: 'Average Diastolic',
        value: Math.round(sum / this.bpSeries[1].series.length)
      })
    }
    this.bpReferenceLines = referenceLines

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
    sum = 0
    weightData[0].data.forEach((entry: any) => {
      sum += entry.value
    })
    this.avgWeight = sum / weightData[0].data.length
  }

  getLast(series: any[] | undefined) {
    if (series == undefined) return undefined
    if (series.length === 0 ) return undefined
    var latest : any = undefined
    if (series[0] !== undefined && series[0].series !== undefined) {
      series[0].series.forEach((entry: any) => {
        if (latest == undefined) latest = entry
        else if (latest.name < entry.name) {
          latest = entry
        }
      })
    } else {
      series.forEach((entry: any) => {
        if (latest == undefined) latest = entry
        else if (latest.name < entry.name) {
          latest = entry
        }
      })
    }
    if (latest !== undefined) return latest.value
    return undefined
  }
  getLastSingle(series: any| undefined) {
    if (series == undefined) return undefined
    var latest : any = undefined
    if ( series.series !== undefined) {
      series.series.forEach((entry: any) => {
        if (latest == undefined) latest = entry
        else if (latest.name < entry.name) {
          latest = entry
        }
      })
    }
    if (latest !== undefined) return latest.value
    return undefined
  }
  getLastE(data: any[]) {

    var latest : any = undefined
    if ( data !== undefined) {
      data.forEach((entry: any) => {
        if (latest == undefined) latest = entry
        else if (latest[0] < entry[0]) {
          latest = entry
        }
      })
    }
    if (latest !== undefined) return latest[1]
    return undefined
  }
  getAvgE(data: any[]) {
    let sum = 0
    var latest : any = undefined
    if ( data !== undefined) {
      data.forEach((entry: any) => {
        sum += entry[1]
      })
      return sum/data.length
    }
    return 0
  }
  round2DP(value : number) {
    return Math.round(value * 100) / 100
  }
  round1DP(value : number) {
    return Math.round(value * 10) / 10
  }
  round(value : number) {
    return Math.round(value )
  }

  getPointColour(ent: any) {
    return 'color: '+ ent.color+ ';'
  }

  getTime(entry: any) {
    return entry.name.toLocaleString()
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

  getContext(measurement : LineSeries) {
      var result: string | undefined = undefined
      if (measurement.name instanceof Date) {
        var contextDate: Date = measurement.name
        this.activity.forEach(activity => {
          var activityDate = new Date(activity.start_date)
          var activityEndDate = new Date(activityDate)
          activityEndDate.setMinutes(activityDate.getMinutes() + (activity.elapsed_time/60))
          //console.log(activity.elapsed_time/60)
          var diff = (activityDate.valueOf() - contextDate.valueOf()) / (1000 *60)
          if (diff > 0 && diff < 60) {
            result = 'Pre Exercise'
          }
          diff = (activityEndDate.valueOf() - contextDate.valueOf()) / (1000 *60)
          if (diff < 0 && diff > -60) {
            result = 'Post Exercise'
          }
        })
      }
      return result
  }


}
