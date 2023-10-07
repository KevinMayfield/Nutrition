import {EventEmitter, Injectable, OnInit} from '@angular/core';
import {client} from "fhirclient";
import Client from "fhirclient/lib/Client";
import {Patient} from "fhir/r4";

@Injectable({
  providedIn: 'root'
})
export class SmartService implements OnInit{

  epr: string | undefined
  ctx : Client | undefined  = undefined
  patient : Patient | undefined;
  patientId : string | undefined;
  age: number| undefined;
  public patientChangeEvent: EventEmitter<Patient> = new EventEmitter();

  constructor() { }

  public setEPR(epr : string) {
    this.epr = epr
    this.getFHIRContext()
  }

  setPatientId(patientId : string) {
    this.patientId = patientId
    this.getFHIRContext()
  }

  public getFHIRContext() {
    if (this.epr !== undefined && this.patientId !== undefined) {
      this.ctx = client({
        serverUrl: this.epr
      });
      this.setPatient()
    }
  }

  setPatient() {
    if (this.ctx !== undefined) {
      this.ctx.request("Patient/" + this.patientId).then(result => {
        console.log(result)
        if (result.resourceType === 'Patient') {
          this.patient = result
          if (this.patient?.birthDate !== undefined) {
            let timeDiff = Math.abs(Date.now() - Date.parse(this.patient.birthDate));
            let age = Math.floor((timeDiff / (1000 * 3600 * 24)) / 365.25);
            this.age = age
          }
          this.patientChangeEvent.emit(this.patient)
        }
      })
    }
  }

  ngOnInit(): void {
  }
}
