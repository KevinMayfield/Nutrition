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

  getBackground(heartrate: number | undefined) {

    if (this.person.hrzones !== undefined && this.person.hrzones.maximumHR !== undefined && heartrate !== undefined) {
      if (this.person.hrzones.z5 !== undefined && this.person.hrzones.z5?.min < heartrate) return "background: lightpink"
      if (this.person.hrzones.z4 !== undefined && this.person.hrzones.z4?.min < heartrate) return "background: lightyellow"
      if (this.person.hrzones.z3 !== undefined && this.person.hrzones.z3?.min < heartrate) return "background: lightgreen"
      if (this.person.hrzones.z2 !== undefined && this.person.hrzones.z2?.min < heartrate) return "background: lightblue"
    }
    return "background: lightgrey"
  }

  setAge(age: any) {
     this.person.age = age
     this.setPerson(this.person)
  }

  setHeight(height: number) {
    this.person.height = height
    this.setPerson(this.person)
  }
}
