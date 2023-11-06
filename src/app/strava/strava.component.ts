import {Component, OnInit} from '@angular/core';
import {StravaService} from "../service/strava.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Person} from "../models/person";

@Component({
  selector: 'app-strava',
  templateUrl: './strava.component.html',
  styleUrls: ['./strava.component.scss']
})
export class StravaComponent implements OnInit{

    stravaConnect = true;
    stravaComplete = false;
    athlete: Person | undefined;
    markdown: string = `
## What does it do
    
 - An estimated daily calorie needs from data held in Strava. This is adjusted according to activities recorded. 
 - Body Mass Index (BMI) calculation
 - Activity Logs, this allows a user to review how they are performing exercise. This is available in two versions
    - Heart rate. The use of a heart rate monitor or smart watch is recommended.
    - Power. This requires a power meter on your bike or indoor trainer. 

## Aims

 - To help people become healthier, and so reducing the demand on health services, by focusing on health aspects to avoid overeating, over training and [Relative energy deficiency in sport](https://en.wikipedia.org/wiki/Relative_energy_deficiency_in_sport)
 - To provide a useful source of information for a user and health/wellbeing practitioner such as a GP, Nutritionist, Fitness Coach, etc.
 - To provide progress reports to a health/wellbeing practitioner. 
    - The author of this website is an experienced health interoperability professional (with an interest in Sports Science and cycling) and is available for implementing [US Physical Activity](https://build.fhir.org/ig/HL7/physical-activity/) in the UK.
 - Other features
    - [Physical Activity Readiness Questionnaire for Everyone (PAR-Q+)](https://eparmedx.com/) in both email+pdf and modern (HL7 FHIR) formats.
    - Physical Activity Care Plans 

## Requirements

In order to get the most out of the application, the following data should be recorded in Strava in the \`Settings\` section.

 - \`My Profile\`
    - Gender
    - Weight
 - \`My Performance\`
    - Functional Threshold Power (FTP)

Once you have connected to Strava via the button below, you should enter in the following information.

  - Height in centimetres
  - Age (this is not supplied by Strava to external applications)  
  - Maximum Heart rate - this will be calculated from the age value you supply, adjust to your individual value.
  
These values are stored locally in your web browser, the application does not store any personnel information.        
    `;

    anchor!: string;

    constructor(public strava: StravaService,
                private router: Router,
                private route: ActivatedRoute,) {
    }
    connectStrava(): void {
        console.log(window.location.origin);
        console.log(window.location.pathname)
        this.strava.authorise(window.location.origin + this.getPathName(window.location.pathname));
    }


    getPathName(pathname: string): string {

        return pathname;

        /*if (pathname.includes('FHIR-R4')) return "/FHIR-R4-Demonstration";
        return "/Wellness";*/
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            const code = params['code'];
            const state = params['state'];
            if (code !== undefined) {
                if (state !== undefined && state === 'withings') {
                    // console.log('Withings detected');

                } else {
                    this.doStravaSetup(code);
                }
            }
        });
        this.strava.tokenChange.subscribe(token => {
            //  console.log('Strava Token Received');
            if (token !== undefined) { this.stravaConnect = false; }
            this.stravaLoad();
        });
        /*
        this.strava.loaded.subscribe(activities => {
            //    console.log('Strava Loaded Received');
            //    console.log(activities)
            const patientRef: Reference = {
                reference: 'Patient/' + this.patientId
            };
            const transaction = this.strava.createTransaction(activities, patientRef);
            this.fhirService.sendTransaction(transaction, 'Strava');
        });

         */
    }
    doStravaSetup(authorisationCode: string): void  {

        //   console.log(authorisationCode);

        // Subscribe to the token change
        this.strava.tokenChange.subscribe(
            () => {
                console.log('Token emit')
                this.router.navigateByUrl('/activity');
            }
        );
        // this will emit a change when the token is retrieved
        this.strava.getOAuth2AccessToken(authorisationCode);
    }


    stravaLoad(): void {
        this.getAthlete();

      //  this.phrLoad(false);
    }

    getAthlete(): void {

        this.strava.getAthlete().subscribe(
            result => {
                this.athlete = result;
                this.strava.setAthlete(result);
            },
            (err) => {
                console.log(err);
                if (err.status === 401) {
                    this.stravaConnect = true;
                }
            }
        );
    }

    jumpToH1(): void {
        this.anchor = 'heading-1';
    }

    jumpToH2(): void {
        this.anchor = 'heading-2';
    }
}
