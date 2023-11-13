import {Component, Input} from '@angular/core';
import {Observations} from "../../models/observations";
import {Color, LegendPosition, ScaleType} from "@swimlane/ngx-charts";
import { curveCatmullRom} from 'd3-shape';
import {EPRService} from "../../service/epr.service";

@Component({
  selector: 'app-body-measures',
  templateUrl: './body-measures.component.html',
  styleUrls: ['./body-measures.component.scss']
})
export class BodyMeasuresComponent {
  measures :Observations[] = []
  weights: any[] | undefined
  muscle: any[] | undefined
  spo2: any[] | undefined
  hba1c: any[] | undefined
  fats: any[] | undefined
  bone: any[] | undefined
  hydration: any[] | undefined
  steps: any[] = [];
  bpSeries : any;
  @Input() set observations(measure: Observations[]) {
   // DEBUG  console.log('No. of measures = ' + measure.length)
    this.measures = measure
    this.refreshActivity()
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
  avgFat = 0
  avgMuscle = 0
  avgHydration = 0
  avgBone = 0
  //curve = curveBasis
  curve = curveCatmullRom
  schemeType: ScaleType = ScaleType.Linear;
  legendPosition: LegendPosition = LegendPosition.Below;
  scaleMin = 9999;
  scaleMax = 0;
  bpReferenceLines: any[] = [];
  hydrationReferenceLines: any[] = [];
  muscleReferenceLines: any[] = [];
  fatsReferenceLines: any[] = [];
  boneReferenceLines: any[] = [];
  weightReferenceLines: any[] = [];
  spo2Min = 9999;
  spo2Max = 0;

  constructor(public epr: EPRService){
    //  this.view = [innerWidth / this.widthQuota, this.view[1]];
  }
  private refreshActivity() {
    this.weights = []
    this.muscle = []
    this.fats = []
    this.bone = []
    this.hydration = []
    this.bpSeries = []
    this.spo2 = []
    this.hba1c = []
    this.steps = []
    var steps: any=[]
    var hb1ac: any[] = [
      {
        name: 'Blood Glucose',
        series: []
      }]
    var weights: any[] = [
      {
        name: 'Body Weight',
        series: []
      }]
    var muscle: any[] = [
      {
        name: 'Muscle Mass',
        series: []
      }]
    var fats: any[] = [
      {
        name: 'Fat Mass',
        series: []
      }]
    var hydration: any[] = [
      {
        name: 'Body Water',
        series: []
      }]
    var bone: any[] = [
      {
        name: 'Bone Mass',
        series: []
      }]
    var bp : any[]= [
      {
        name: 'Systole',
        series: []
      },
      {
        name: 'Diastole',
        series: []
      }
    ]
    var spo2 : any[]= [
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
          let weight = {
            name: observations.day,
            value: observations.weight
          }
          weights[0].series.push(weight)
        }
        if (observations.muscle_mass !== undefined) {
          if (observations.muscle_mass < this.muscleMin) this.muscleMin = observations.muscle_mass
          if (observations.muscle_mass > this.muscleMax) this.muscleMax = observations.muscle_mass
          let weight = {
            name: observations.day,
            value: observations.muscle_mass
          }
          muscle[0].series.push(weight)
        }
      if (observations.fat_mass !== undefined) {
        if (observations.fat_mass < this.fatMin) this.fatMin = observations.fat_mass
        if (observations.fat_mass > this.fatMax) this.fatMax = observations.fat_mass
        let weight = {
          name: observations.day,
          value: observations.fat_mass
        }
        fats[0].series.push(weight)
      }

      if (observations.bone_mass !== undefined) {
        if (observations.bone_mass < this.boneMin) this.boneMin = observations.bone_mass
        if (observations.bone_mass > this.boneMax) this.boneMax = observations.bone_mass
        let weight = {
          name: observations.day,
          value: observations.bone_mass
        }
        bone[0].series.push(weight)
      }
      if (observations.hydration !== undefined) {
        if (observations.hydration < this.hydrationMin) this.hydrationMin = observations.hydration
        if (observations.hydration > this.hydrationMax) this.hydrationMax = observations.hydration
        let weight = {
          name: observations.day,
          value: observations.hydration
        }
        hydration[0].series.push(weight)
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
        }
        if (observations.spo2.min !== undefined) {
          if (observations.spo2.min < this.spo2Min) this.spo2Min = observations.spo2.min
          spo2[1].series.push({
            name: observations.day,
            value: observations.spo2.min
          })
        }
        if (observations.spo2.max !== undefined) {
          if (observations.spo2.max > this.spo2Max) this.spo2Max = observations.spo2.max
          spo2[2].series.push({
            name: observations.day,
            value: observations.spo2.max
          })
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
    this.muscle = muscle
    this.hydration = hydration
    this.weights = weights
    this.fats = fats
    this.bone = bone
    this.bpSeries = bp
    this.spo2 = spo2
    this.hba1c = hb1ac
    this.steps = steps

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

    sum=0
    muscle[0].series.forEach((entry: any) => {
      sum += entry.value
    })
    this.avgMuscle = sum / muscle[0].series.length
    this.muscleReferenceLines = [{
      name: 'Average',
      value: this.avgMuscle
    }]
    sum = 0
    weights[0].series.forEach((entry: any) => {
      sum += entry.value
    })
    this.avgWeight = sum / weights[0].series.length
    this.weightReferenceLines = [{
      name: 'Average',
      value: this.avgWeight
    }]
    sum = 0
    fats[0].series.forEach((entry: any) => {
      sum += entry.value
    })
    this.avgFat = sum / fats[0].series.length
    this.fatsReferenceLines = [{
      name: 'Average',
      value: this.avgFat
    }]
    sum = 0
    bone[0].series.forEach((entry: any) => {
      sum += entry.value
    })
    this.avgBone = sum / weights[0].series.length
    this.boneReferenceLines = [{
      name: 'Average',
      value: this.avgBone
    }]
    sum = 0
    hydration[0].series.forEach((entry: any) => {
      sum += entry.value
    })
    this.avgHydration = sum / hydration[0].series.length
    this.hydrationReferenceLines = [{
      name: 'Average',
      value: this.avgHydration
    }]
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

      var result = entry.name.toLocaleString()
      return result
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
}
