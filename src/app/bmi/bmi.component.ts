import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {client} from "fhirclient";
import Client from "fhirclient/lib/Client";
import {
    Bundle,
    Observation,
    Parameters,
    Patient,
    QuestionnaireResponse,
    ValueSet,
    ValueSetExpansionContains
} from "fhir/r4";
import {HttpClient} from "@angular/common/http";
import { DatePipe } from '@angular/common';
// @ts-ignore
import {v4 as uuidv4} from 'uuid';
import { TdDialogService } from '@covalent/core/dialogs';
import {SmartService} from "../service/smart.service";

@Component({
  selector: 'app-bmi',
  templateUrl: './bmi.component.html',
  styleUrls: ['./bmi.component.scss']
})
export class BMIComponent implements OnInit {
    bmi: string | undefined;


    ethnicCategories: ValueSetExpansionContains[] | undefined;
    ethnicCategory :ValueSetExpansionContains | undefined
    administrativeGenders: ValueSetExpansionContains[] | undefined;
    administrativeGender :ValueSetExpansionContains | undefined
    epr: string | undefined

    markdown = `This is a mock to demonstrate the launch of application via [SMART Launch](https://www.hl7.org/fhir/smart-app-launch/)

It is based on [BMI healthy weight calculator](https://www.nhs.uk/live-well/healthy-weight/bmi-calculator/)`
    height: number | undefined;

    weight: number | undefined;
    waist: number | undefined;
    waistratio: string | undefined;
    bmiLabel: any;
    bmiColour: any;
    bmiIcon: any;
    waistratioLabel: any;
    waistratioColour: any;
    waistratioIcon: any;
    age: any;

    constructor(private route: ActivatedRoute,
                private http: HttpClient,
                private _dialogService: TdDialogService,
                private smart: SmartService) { }

    calculate() {

        var bundle : Bundle = {
            entry: [], type: "transaction",
            resourceType: 'Bundle'
        }
        if (this.weight !== undefined && this.height !== undefined) {
            var calc = this.weight / ((this.height/100) * (this.height/100))
            console.log(calc)
            this.bmi = 'A BMI calculation in the healthy weight range is between 18.5 to 24.9. For Black, Asian and some other minority ethnic groups, the healthy weight range is 18.5 to 23.'
            this.bmiIcon = "info"
            this.bmiColour="primary"
            this.bmiLabel='Your BMI is '+calc.toFixed(1)

            var observation: Observation = {
                code: {
                    coding: [
                        {
                            "system": "http://snomed.info/sct",
                            "code": "60621009",
                            "display": "Body mass index"
                        }
                    ]
                }, resourceType: "Observation", status:"final"
            }
            observation.subject = {
                "reference": "Patient/"+this.smart.patient?.id
            }
            observation.effectiveDateTime =this.getFHIRDateString(new Date())
            observation.valueQuantity = {
              value: calc,
                code: 'kg/m2'
            }
            bundle.entry?.push({
                "fullUrl": "urn:uuid:" + uuidv4(),
                "resource": observation,
                "request": {
                    url: "Observation",
                    method: "POST"
                }
            })
            console.log(bundle)
        }
        if (this.height !== undefined && this.waist !== undefined) {
            var calc = this.waist / this.height

            this.waistratio =  ' A waist to height ratio of 0.5 or higher means you may have increased health risks such as heart disease, type 2 diabetes and stroke.'
            this.waistratioLabel = 'Waist to height ratio '+calc.toFixed(2)
            this.waistratioIcon="info"
            this.waistratioColour="primary"
            var observation: Observation = {
                code: {
                    coding: [
                        {
                            "system": "http://snomed.info/sct",
                            "code": "248367009",
                            "display": "Waist/hip ratio"
                        }
                    ]
                }, resourceType: "Observation", status:"final"
            }
            observation.subject = {
                "reference": "Patient/"+this.smart.patientId
            }
            observation.effectiveDateTime =this.getFHIRDateString(new Date())
            observation.valueQuantity = {
                value: calc
            }
            bundle.entry?.push({
                "fullUrl": "urn:uuid:" + uuidv4(),
                "resource": observation,
                "request": {
                    url: "Observation",
                    method: "POST"
                }
            })
        }
        // @ts-ignore
        if (bundle.entry?.length > 0 && this.epr !== undefined ) {
            this.http.post(this.epr + '/', bundle).subscribe(result => {
                console.log(result)
            })
        }

    }

    ngOnInit(): void {
        this.smart.patientChangeEvent.subscribe(patient => {
            this.age = this.smart.age
            var parameters: Parameters = {
                "resourceType": "Parameters",

                "parameter": [
                    {
                        "name": "subject",
                        "valueReference": {
                            "reference": "Patient/" + patient.id
                        }
                    },
                    {
                        "name": "questionnaireRef",
                        "valueReference": {
                            "reference": "Questionnaire/b1132517-9aea-4968-910b-ccfa3889c33a"
                        }
                    }
                ]
            }

            // @ts-ignore
            this.http.post(this.smart.epr + '/Questionnaire/$populate', parameters).subscribe(result => {
                console.log(result)
                if (result !== undefined) {

                    var parameters = result as Parameters
                    if (parameters.parameter !== undefined) {

                        for (var parameter of parameters.parameter) {
                            if (parameter.name === 'response') {

                                var questionnaireResponse = parameter.resource as QuestionnaireResponse
                                if (questionnaireResponse.item !== undefined) {

                                    for (var item of questionnaireResponse.item) {
                                        if (item.linkId === '9832470915833') {
                                            // @ts-ignore
                                            this.height = item.answer[0].valueQuantity.value
                                        }

                                        if (item.linkId === '81247982689') {
                                            // @ts-ignore
                                            this.weight = item.answer[0].valueQuantity.value
                                        }
                                        if (item.linkId === '7761181498456') {
                                            // @ts-ignore
                                            this.waist = item.answer[0].valueQuantity.value
                                        }
                                        if (item.linkId === '7658017405403' && this.ethnicCategories !== undefined) {
                                            for (var ethnic of this.ethnicCategories) {

                                                // @ts-ignore
                                                if (item.answer[0].valueCoding.code === ethnic.code) {
                                                    this.ethnicCategory = ethnic
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })
            this.http.get(this.smart.epr + '/ValueSet/$expand?url=https://fhir.hl7.org.uk/ValueSet/UKCore-EthnicCategory').subscribe(result => {
                console.log(result)
                this.ethnicCategories = this.getContainsExpansion(result)
                this.setSelectAnswers()
            })
            this.http.get(this.smart.epr + '/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/administrative-gender').subscribe(result => {
                console.log(result)
                this.administrativeGenders = this.getContainsExpansion(result)
                this.setSelectAnswers()
            })
        }
        )
    }

    getContainsExpansion(resource: any): ValueSetExpansionContains[] {
        const valueSet = resource as ValueSet;
        const contains: ValueSetExpansionContains[] = [];
        if (valueSet !== undefined && valueSet.expansion !== undefined && valueSet.expansion.contains !== undefined) {
            for (const concept of valueSet.expansion.contains) {
                contains.push(concept);
            }
        }
        return contains;
    }

    setSelectAnswers() {
        if (this.smart.patient !== undefined) {
            if (this.administrativeGenders !== undefined) {
                for (var gender of this.administrativeGenders) {

                    if (gender.code === this.smart.patient.gender) {
                        this.administrativeGender = gender
                    }
                }
            }
            if (this.ethnicCategories !== undefined) {

            }
        }
    }
    getFHIRDateString(date : Date) : string {
        var datePipe = new DatePipe('en-GB');
        //2023-05-12T13:22:31.964Z
        var utc = datePipe.transform(date, 'yyyy-MM-ddTHH:mm:ss.SSSZZZZZ');
        if (utc!= null) return utc
        return date.toISOString()
    }

    showAlert(): void {
        this._dialogService.openAlert({
            title: 'BMI Risks',
            message:
                'For people of White heritage, a BMI:\n' +
                '\n' +
                'below 18.5 is underweight\n' +
                'between 18.5 and 24.9 is healthy\n' +
                'between 25 and 29.9 is overweight\n' +
                'of 30 or over is obese\n' +
                'Black, Asian and some other minority ethnic groups have a higher risk of developing some long-term conditions such as type 2 diabetes with a lower BMI. People from these groups with a BMI of:\n' +
                '\n' +
                '23 or more are at increased risk (overweight)\n' +
                '27.5 or more are at high risk (obese)',
        });
    }
}
