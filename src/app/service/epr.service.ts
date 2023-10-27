import {EventEmitter, Injectable} from '@angular/core';
import {hrZone, Person} from "../models/person";
import {SummaryActivity} from "../models/summary-activity";
import {Zones} from "../models/stream";
import {resetCumulativeDurations} from "@angular-devkit/build-angular/src/tools/esbuild/profiling";

@Injectable({
  providedIn: 'root'
})
export class EPRService {

  person: Person = {

  };

  zoneChange: EventEmitter<hrZone> = new EventEmitter();
  constructor() {
    var person = localStorage.getItem('activityPerson')
    if (person !== null) this.person = JSON.parse(person)
  }

  setPerson(athlete: Person) {

    // These entries preserve existing data
    if (athlete.hrzones === undefined && this.person.hrzones !== undefined) {
      athlete.hrzones = this.person.hrzones
    }
    if (athlete.age === undefined && this.person.age !== undefined) {
      athlete.age = this.person.age
    }
    if (athlete.height === undefined && this.person.height !== undefined) {
      athlete.height = this.person.height
    }
    if (athlete.waist === undefined && this.person.waist !== undefined) {
      athlete.waist = this.person.waist
    }
    if (athlete.ethnic === undefined && this.person.ethnic !== undefined) {
      athlete.ethnic = this.person.ethnic
    }

    this.person = athlete
    localStorage.setItem('activityPerson', JSON.stringify(this.person))
  }

  setHRZone(param: hrZone) {
    this.zoneChange.emit(param)
      console.log('set HR Zone')
     this.person.hrzones = param
     this.setPerson(this.person)
     this.zoneChange.emit(param)
  }

  getDateAbs(time: Date) {
    return Math.floor(time.getTime() / (1000 * 3600 * 24));
  }

  getBackgroundHR(heartrate: number | undefined) {

    if (this.person.hrzones !== undefined && this.person.hrzones.maximumHR !== undefined && heartrate !== undefined) {
      if (this.person.hrzones.z5 !== undefined && this.person.hrzones.z5?.min < heartrate) return "lightpink"
      if (this.person.hrzones.z4 !== undefined && this.person.hrzones.z4?.min < heartrate) return "lightsalmon"
      if (this.person.hrzones.z3 !== undefined && this.person.hrzones.z3?.min < heartrate) return "lightgreen"
      if (this.person.hrzones.z2 !== undefined && this.person.hrzones.z2?.min < heartrate) return "lightblue"
    }
    return "lightgrey"
  }

  setAge(age: any) {
     this.person.age = age
     this.setPerson(this.person)
  }

  setHeight(height: number) {
    this.person.height = height
    this.setPerson(this.person)
  }
  setWaist(waist: number) {
    this.person.waist = waist
    this.setPerson(this.person)
  }
  setEthnic(ethnic: string) {
    this.person.ethnic = ethnic
    this.setPerson(this.person)
  }
  perKgKCal(number: number): number | undefined {
    if (this.person.weight === undefined) return undefined
    return Math.round(number * this.person.weight)
  }

  perKgMl(number: number): number | undefined {
    if (this.person.weight === undefined) return undefined
    return Math.round(number * this.person.weight)
  }

  pizza(kcal: number | undefined) {
    if (kcal === undefined || kcal === 0) return undefined

    // Using zwift pizza units https://www.bikeradar.com/advice/fitness-and-training/how-to-read-a-zwift-ride-report
    var number= Math.round(kcal/285)
    if (number === undefined || number === 0 || isNaN(+number)) return undefined
    return new Array(number).fill(0)
        .map((n, index) => index + 1);
  }
  getWeekNumber(d : Date) {
    // Copy date so don't modify original
    let onejan = new Date(d.getFullYear(), 0, 1);
    let week = Math.ceil((this.getDateAbs(d) - this.getDateAbs(onejan) + onejan.getDay() + 1) / 7);
    // Return array of year and week number
    return week;
  }

  getFTPColours() {
    var colours : string[] = ['lightgrey', 'lightblue', 'lightgreen', '#FFF59D','lightsalmon','lightpink','lightcoral' ]
    return colours
  }
  getBackgroundPWR(pwr: number | undefined) {
    console.log(pwr)
    let ftp = this.person.ftp
    let colours = this.getFTPColours()
    if (ftp !== undefined && pwr !== undefined) {
      if (pwr >= (ftp * 1.20)) {
        return colours[6]
      } else if (pwr >= (ftp * 1.06)) {
        return colours[5]
      } else if (pwr >= (ftp * 0.95)) {
        return colours[4]
      } else if (pwr >= (ftp * 0.88)) {
        return colours[3]
      } else if (pwr >= (ftp * 0.76)) {
        return colours[2]
      } else if (pwr >= (ftp * 0.55)) {
        return colours[1]
      }
    }
    return colours[0]
  }
  duration(value: number) {
    let min = Math.round(value%60)
    let hr = Math.floor(value /60)
    if (hr> 0) return hr + ' hr '+ min + ' min';
    return min + ' min'
  }

  getZones(activity: SummaryActivity) : Zones[] {
    var zones : Zones[] = []

    if (activity.stream !== undefined) {
      var hr : Zones = {
        distribution_buckets: [], resource_state: 0, sensor_based: false, type: "heartrate"
      }
      var pwr : Zones = {
        distribution_buckets: [], resource_state: 0, sensor_based: false, type: "power"
      }
       if (activity.stream.heartrate !== undefined) {

         if (this.person.hrzones !== undefined) {

           // @ts-ignore
           hr.distribution_buckets.push({max: this.person.hrzones.z1?.max, min: this.person.hrzones.z1?.min, time: 0})
           // @ts-ignore
           hr.distribution_buckets.push({max: this.person.hrzones.z2?.max, min: this.person.hrzones.z2?.min, time: 0})
           // @ts-ignore
           hr.distribution_buckets.push({max: this.person.hrzones.z3?.max, min: this.person.hrzones.z3?.min, time: 0})
           // @ts-ignore
           hr.distribution_buckets.push({max: this.person.hrzones.z4?.max, min: this.person.hrzones.z4?.min, time: 0})
           // @ts-ignore
           hr.distribution_buckets.push({max: this.person.hrzones.z5?.max, min: this.person.hrzones.z5?.min, time: 0})

         }



       }
      if (activity.stream.watts !== undefined && this.person.ftp !== undefined) {

        let pwrZone = this.getPWRZone()
        if (pwrZone!== undefined) {
          pwr.distribution_buckets.push({max: pwrZone.z1.max, min: pwrZone.z1?.min, time: 0})
          pwr.distribution_buckets.push({max: pwrZone.z2.max, min: pwrZone.z2?.min, time: 0})
          pwr.distribution_buckets.push({max: pwrZone.z3.max, min: pwrZone.z3?.min, time: 0})
          pwr.distribution_buckets.push({max: pwrZone.z4.max, min: pwrZone.z4?.min, time: 0})
          pwr.distribution_buckets.push({max: pwrZone.z5.max, min: pwrZone.z5?.min, time: 0})
          pwr.distribution_buckets.push({max: pwrZone.z6.max, min: pwrZone.z6?.min, time: 0})
          pwr.distribution_buckets.push({max: 2000, min: pwrZone.z7?.min, time: 0})
        }
      }
      if (activity.stream.time !== undefined) {
        var lastTime = 0;
        for (let i = 0; i < activity.stream.time.original_size; i++) {
          let duration = activity.stream.time.data[i]
          if (activity.stream.heartrate !== undefined && hr.distribution_buckets.length>0) {
            for (let range of hr.distribution_buckets) {
               if (activity.stream.heartrate.data[i] < range.max && activity.stream.heartrate.data[i] >= range.min) {
                 range.time = range.time + (duration - lastTime)
                 break
               }
            }
          }
          if (activity.stream.watts !== undefined && hr.distribution_buckets.length>0) {
            for (let range of pwr.distribution_buckets) {
            //  console.log(range.max + ' ' +activity.stream.watts.data[i])
              if (activity.stream.watts.data[i] >= range.min &&
                  (activity.stream.watts.data[i] < range.max)) {
                range.time = range.time + (duration - lastTime)
                break
              }
            }
          }
          lastTime = duration
        }
      }
      if (hr.distribution_buckets.length>0) zones.push(hr)
      if (pwr.distribution_buckets.length>0)zones.push(pwr)
    }
    return zones;
  }

  getPWRZone() {
    let ftp = this.person.ftp
    if (ftp !== undefined) return  {
      calculated : true,
          ftp: ftp,
        z1: {
      min: 0,
          max: Math.round(0.55 * ftp)
    },
      z2: {
        min: Math.round(0.55 * ftp) ,
            max:Math.round(0.76 * ftp)
      },
      z3: {
        min: Math.round(0.76 * ftp) ,
            max:Math.round(0.88 * ftp)
      },
      z4: {
        min: Math.round(0.88 * ftp),
            max:Math.round(0.95 * ftp)
      },
      z5: {
        min: Math.round(0.95 * ftp),
            max:Math.round(1.06 * ftp)
      },
      z6: {
        min: Math.round(1.06 * ftp) ,
            max: Math.round(1.2 * ftp)
      },
      z7: {
        min: Math.round(1.2 * ftp)
      },
    }
    return undefined;
  }
}
