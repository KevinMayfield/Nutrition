import {Component, OnInit} from '@angular/core';
import {StravaService} from "../service/strava.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Athlete} from "../service/models/athlete";

@Component({
  selector: 'app-strava',
  templateUrl: './strava.component.html',
  styleUrls: ['./strava.component.scss']
})
export class StravaComponent implements OnInit{

    stravaConnect = true;
    stravaComplete = false;
    athlete: Athlete | undefined;
    constructor(public strava: StravaService,
                private router: Router,
                private route: ActivatedRoute,) {
    }
    connectStrava(): void {
        console.log(window.location.origin);
        this.strava.authorise(window.location.origin + this.getPathName(window.location.pathname) + '/strava/');
    }


    getPathName(pathname: string): string {
        if (pathname.includes('FHIR-R4')) return "/FHIR-R4-Demonstration";
        return "";
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
                this.router.navigateByUrl('/nutrition');
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
}
