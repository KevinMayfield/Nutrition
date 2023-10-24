import {EventEmitter, Injectable} from '@angular/core';
import {hrZone, Person} from "../models/person";
import {SummaryActivity} from "../models/summary-activity";

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

  getBackground(heartrate: number | undefined) {

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
    var colours : string[] = []
    let ftp = this.person.ftp
    if (ftp !== undefined) {
      for (let i = 0; i < 10; i++) {
        let pwr = (i * 50) + 25; // crude

        if (pwr > (ftp * 1.20)) {
          colours.push('lightcoral')
        } else if (pwr > (ftp * 1.06)) {
          colours.push('lightpink')
        } else if (pwr > (ftp * 0.95)) {
          colours.push('lightsalmon')
        } else if (pwr > (ftp * 0.88)) {
          colours.push('#FFF59D')
        } else if (pwr > (ftp * 0.76)) {
          colours.push('lightgreen')
        } else if (pwr > (ftp * 0.55)) {
          colours.push('lightblue')
        } else {
          colours.push('lightgrey')
        }
      }
    }
    return colours
  }
}
