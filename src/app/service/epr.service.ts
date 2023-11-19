import {EventEmitter, Injectable} from '@angular/core';
import {hrZone, Person} from "../models/person";
import {SummaryActivity} from "../models/summary-activity";
import {Zones} from "../models/stream";
import {Sex} from "../models/sex";
import {LocalService} from "./local.service";
import {StravaService} from "./strava.service";

@Injectable({
  providedIn: 'root'
})
export class EPRService {

  private from: Date | undefined;
  private to: Date | undefined;
  private baseDuration = 14; // keep low while developing to avoid hitting rate limits
  public duration = this.baseDuration
  endWeekChanged: EventEmitter<any> = new EventEmitter();

  person: Person = {

  };

  // Traffic Lights \/  \/
  weightWarnLow = -0.7
  weightWarnHigh = 0.4

  muscleWarnLow = -0.5 // Glycogen is roughly 1.2

  hydratedWarnHigh= 0.3;
  hydratedWarnLow= -0.5;

  hrvRested = 5
  hrvWarnLow = -5
  hrWarnHigh = 5
  hrRested = -5
  // /\ Traffic Lights /\
  ignoreElapsed = 120

  zoneChange: EventEmitter<hrZone> = new EventEmitter();

  constructor(private localStore: LocalService) {
    let tempDate = new Date()

    this.setToDate(tempDate);
   var person = localStore.getData('activityPerson')
   if (person !== null && person !== undefined && person !== '') this.person = JSON.parse(person)
  }

  setToDate(date : Date) {
    this.to = date;
    this.to.setHours(23,59, 59)
    this.from = new Date(this.to.toISOString());
    this.from.setHours(0,0, 1)
    this.from.setDate(this.from.getDate() - this.baseDuration);
    while (this.from.getDay() !== 0) {
      this.from.setDate(this.from.getDate() - 1);
    }
    var diffDays = this.getDateAbs(this.to) - this.getDateAbs(this.from);
    console.log(this.to.toISOString() + ' ' + diffDays)
    this.duration = diffDays
    this.endWeekChanged.emit(this.to)
  }
  getFromDate(): Date {
    return <Date>this.from;
  }

  getToDate(): Date {
    // @ts-ignore
    return new Date(this.to.toISOString());
  }

  getNextToDay(): Date {
    var temp = new Date(this.getToDate().toISOString());
    temp.setDate(temp.getDate() + 1);
    return temp;
  }
  dayOfWeek(number: number) {
    var now = this.getToDate();
    var from = this.getToDate();
    from.setDate(now.getDate() - this.duration + number );
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return days[ from.getDay() ];
  }

  getSundayFromWeekNum(weekNum: number | undefined) {
    if (weekNum !== undefined) {
      var sunday = new Date(this.getToDate().getFullYear(), 0, (1 + (weekNum - 1) * 7));
      while (sunday.getDay() !== 0) {
        sunday.setDate(sunday.getDate() + 1);
      }
      return sunday;
    }
    return this.getToDate()
  }

  setPerson(athlete: Person) {

    // These entries preserve existing data
    if (athlete.maximumHR === undefined && this.person.maximumHR !== undefined) {
      athlete.maximumHR = this.person.maximumHR
    }
    if (athlete.restingHR === undefined && this.person.restingHR !== undefined) {
      athlete.restingHR = this.person.restingHR
    }
    if (athlete.age === undefined && this.person.age !== undefined) {
      athlete.age = this.person.age
    }
    if (athlete.height === undefined && this.person.height !== undefined) {
      athlete.height = this.person.height
    }
    if (athlete.weight === undefined && this.person.weight !== undefined) {
      athlete.weight = this.person.weight
    }
    if (athlete.waist === undefined && this.person.waist !== undefined) {
      athlete.waist = this.person.waist
    }
    if (athlete.ethnic === undefined && this.person.ethnic !== undefined) {
      athlete.ethnic = this.person.ethnic
    }

    this.person = athlete
    this.localStore.saveData('activityPerson', JSON.stringify(this.person))
  }

  setMaximumHR(maximumHR : number) {
      if (maximumHR !== undefined && maximumHR > 100 && this.person.maximumHR !== maximumHR) {
        this.person.maximumHR = maximumHR
        this.setPerson(this.person)
        this.zoneChange.emit(this.getHRZone())
      }
  }
  setRestingHR(restingHR: any) {
    if (restingHR !== undefined && restingHR > 30 && this.person.restingHR !== restingHR) {
      this.person.restingHR = restingHR
      this.setPerson(this.person)
      this.zoneChange.emit(this.getHRZone())
    }
  }

  getDateAbs(time: Date) {
    return Math.floor(time.getTime() / (1000 * 3600 * 24));
  }

  getBackgroundHR(heartrate: number | undefined) {
    if (this.person.maximumHR == undefined) return 'lightgrey'
    let hrzones = this.getHRZone()
    if (hrzones !== undefined && heartrate !== undefined) {
      if (hrzones.z5 !== undefined && hrzones.z5?.min < heartrate) return "lightpink"
      if (hrzones.z4 !== undefined && hrzones.z4?.min < heartrate) return "lightsalmon"
      if (hrzones.z3 !== undefined && hrzones.z3?.min < heartrate) return "lightgreen"
      if (hrzones.z2 !== undefined && hrzones.z2?.min < heartrate) return "lightblue"
    }
    return "lightgrey"
  }

  setAge(age: any) {
     this.person.age = age
     this.setPerson(this.person)
  }

  setHeight(height: number) {

    if (this.person.height === undefined || this.person.height !== height) {
      console.log('Set Height: '+height)
      this.person.height = height
      this.setPerson(this.person)
    }
  }
  setWaist(waist: number) {
    this.person.waist = waist
    this.setPerson(this.person)
  }
  setEthnic(ethnic: string) {
    this.person.ethnic = ethnic
    this.setPerson(this.person)
  }
  setWeight(weight: number) {
    if (this.person.weight === undefined || this.person.weight !== weight) {
      console.log('Set Weight: ' + weight)
      this.person.weight = weight
      this.setPerson(this.person)
    }
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
  durationString(value: number) {
    let min = Math.round(value%60)
    let hr = Math.floor(value /60)
    if (hr> 0) return hr + ' hr '+ min + ' min';
    return min + ' min'
  }

  getZonesAndCalculateScores(activity: SummaryActivity) : Zones[] {
    var zones : Zones[] = []

    if (activity.stream !== undefined) {
      var hr : Zones = {
        distribution_buckets: [], resource_state: 0, sensor_based: false, type: "heartrate"
      }
      var pwr : Zones = {
        distribution_buckets: [], resource_state: 0, sensor_based: false, type: "power"
      }
       // Set up Heart Rate Zones
       if (activity.stream.heartrate !== undefined) {

         if (this.person.maximumHR !== undefined) {
           let hrzones = this.getHRZone()
           // @ts-ignore
           hr.distribution_buckets.push({max: hrzones.z1?.max, min: hrzones.z1?.min, time: 0})
           // @ts-ignore
           hr.distribution_buckets.push({max: hrzones.z2?.max, min: hrzones.z2?.min, time: 0})
           // @ts-ignore
           hr.distribution_buckets.push({max: hrzones.z3?.max, min: hrzones.z3?.min, time: 0})
           // @ts-ignore
           hr.distribution_buckets.push({max: hrzones.z4?.max, min: hrzones.z4?.min, time: 0})
           // @ts-ignore
           hr.distribution_buckets.push({max: hrzones.z5?.max, min: hrzones.z5?.min, time: 0})

         }
       }
      // Set up Power Zones
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
      // Performance Zone calculations
      if (activity.stream.time !== undefined && activity.stream.distance) {
        var lastTime = 0;
        for (let i = 0; i < activity.stream.time.original_size; i++) {
          let duration = activity.stream.time.data[i]
          let distance = activity.stream.distance.data[i]
          let elapsed = duration - lastTime

          if (distance !== undefined && distance > 0 && elapsed < this.ignoreElapsed) {

            if (activity.stream.heartrate !== undefined && hr.distribution_buckets.length > 0) {
              for (let range of hr.distribution_buckets) {
                if (activity.stream.heartrate.data[i] < range.max && activity.stream.heartrate.data[i] >= range.min) {
                  range.time = range.time + elapsed
                  break
                }
              }
            }
            if (activity.stream.watts !== undefined && hr.distribution_buckets.length > 0) {
              for (let range of pwr.distribution_buckets) {
                //  console.log(range.max + ' ' +activity.stream.watts.data[i])
                if (activity.stream.watts.data[i] >= range.min &&
                    (activity.stream.watts.data[i] < range.max)) {
                  range.time = range.time + elapsed
                  break
                }
              }
            }
          } else {
            //  console.log('no distance')
          }
          lastTime = duration
        }
      }

        // TSS Calculation
      if (activity.stream.time !== undefined && activity.stream.distance) {
        if (activity.stream.watts !== undefined && hr.distribution_buckets.length > 0) {
          var rolling30: number[] = []
          for (let i = 0; i < activity.stream.time.original_size; i++) {
            let start = activity.stream.time.data[i]
            let distance = activity.stream.distance.data[i]
            let power30: number[] = []
            if (distance > 0) {

              for (let f = i; f < activity.stream.time.original_size; f++) {
                let end = activity.stream.time.data[f]
                if (end - start > 30) break;
                power30.push(activity.stream.watts.data[f])
              }

              let total30 = 0
              power30.forEach((value) => {
                total30 += value
              })
              rolling30.push(Math.pow(total30 / power30.length, 4))
            }
          }
          let tot30 = 0
          rolling30.forEach((value => {
            tot30 += value
          }))
          let avg30 = tot30 / rolling30.length
          activity.np = Math.round(Math.sqrt(Math.sqrt(avg30)))
        }
      }

        // TRIMP and hrTSS Calculation
      if (activity.stream.time !== undefined && activity.stream.distance) {
        if (activity.stream.heartrate !== undefined
            && this.person.maximumHR !== undefined
            && this.person.restingHR !== undefined) {
          var hrReserve = this.person.maximumHR - this.person.restingHR

          var trimpExp = 0
          var lastTime = 0;
          for (let i = 0; i < activity.stream.time.original_size; i++) {
            let duration = activity.stream.time.data[i]
            let distance = activity.stream.distance.data[i]
            let elapsed = duration - lastTime
            lastTime = duration
            if (distance > 0 && elapsed < this.ignoreElapsed) {
              let genderFactor = 1.92
              if (this.person.sex == Sex.Female) genderFactor = 1.67
              let hrr = ((activity.stream.heartrate.data[i] - this.person.restingHR) / (hrReserve))
              trimpExp += (elapsed / 60) * hrr * 0.64 * Math.exp(genderFactor * hrr)
            }
          }

          activity.trimp = Math.round(trimpExp)
        }
      }
      if (hr.distribution_buckets.length>0) zones.push(hr)
      if (pwr.distribution_buckets.length>0)zones.push(pwr)
    }
    return zones;
  }
getHRZone() {

    let maximumHR = this.person.maximumHR
    if (maximumHR !== undefined) {
      return {
        calculated: true,
        maximumHR: Math.round(maximumHR),
        z1: {
          min: Math.round(0),
          max: Math.round(maximumHR * 0.6)
        },
        z2: {
          min: Math.round(maximumHR * 0.6),
          max: Math.round(maximumHR * 0.7)
        },
        z3: {
          min: Math.round(maximumHR * 0.7),
          max: Math.round(maximumHR * 0.8)
        },
        z4: {
          min: Math.round(maximumHR * 0.8),
          max: Math.round(maximumHR * 0.9)
        },
        z5: {
          min: Math.round(maximumHR * 0.9),
          max: Math.round(maximumHR * 1.0)
        }
      }
    } else {
      return undefined
    }

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
  stressTraining(activity: SummaryActivity) {
    if (activity.np !== undefined && this.person.ftp !== undefined) {
      let intensity = activity.np / this.person.ftp
      let tss = 100 * (((activity.moving_time) * activity.np * intensity) / (this.person.ftp * 3600))
      return Math.round(tss)
    } else {
      return 0
    }
  }

  getTrimpColour(trimp: number) : string {
    if (trimp > 500) {
      return '#A10A28'
    } else
    if (trimp > 350) {
      return '#C7B42C'
    } else if (trimp > 200) {
      return '#5AA454'
    } else {
      return '#7aa3e5'
    }
  }
  getTrimpZone(trimp: number) : number {
    if (trimp > 500) {
      return 4
    } else
    if (trimp > 350) {
      return 3
    } else if (trimp > 200) {
      return 2
    } else {
      return 1
    }
  }
  getTSSColour(entryTss: number): string {
    if (entryTss > 450) {
      return '#A10A28'
    } else
    if (entryTss > 300) {
      return '#C7B42C'
    } else if (entryTss > 150) {
      return '#5AA454'
    } else {
      return '#7aa3e5'
    }
  }
  getOK() {
    return {'background':'lightgreen'};
  }
  getWarning() {
    return {'background':'lightsalmon'};
  }
  getInfo() {
    return {'background':'lightblue'};
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

  getMinE(data: any[]) {
    let min = 9999
    var latest : any = undefined
    if ( data !== undefined) {
      data.forEach((entry: any) => {
        if (entry[1] < min) min = entry[1]
      })
      return min
    }
    return 0
  }
  getMaxE(data: any[]) {
    let max = 0
    var latest : any = undefined
    if ( data !== undefined) {
      data.forEach((entry: any) => {
        if (entry[1] > max) max = entry[1]
      })
      return max
    }
    return 0
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

}
