import {Component, EventEmitter, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {hrZone, pwrZone} from "../models/person";
import { ValueSetExpansionContains} from "fhir/r4";
import {HttpClient} from "@angular/common/http";
import {EPRService} from "../service/epr.service";
import {SmartService} from "../service/smart.service";
import {StravaService} from "../service/strava.service";
import {WithingsService} from "../service/withings.service";
import {ActivatedRoute, Router} from "@angular/router";
import {GoogleFitService} from "../service/google-fit.service";


@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PersonComponent implements OnInit {
  height: number | undefined;
  weight: number | undefined;
  waist: number | undefined;
  age: any;
  restingHR: any;
  maximumHR: undefined | number;
  ftp: number | undefined;

  administrativeGenders: ValueSetExpansionContains[] | undefined;
  administrativeGender :ValueSetExpansionContains | undefined

  ethnicCategories: ValueSetExpansionContains[] | undefined;
  ethnicCategory :ValueSetExpansionContains | undefined

  zoneHR: hrZone | undefined
  zonePWR: pwrZone | undefined

  @Output()
  pageName = new EventEmitter();
  constructor(
      private http: HttpClient,
      private epr: EPRService,
      private smart: SmartService,
      private strava: StravaService,
      private router: Router,
      private route: ActivatedRoute,
      private withings: WithingsService,
      private googleFit : GoogleFitService) {
  }

  ngOnInit(): void {
    this.pageName.emit('Physical Activity')
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const state = params['state'];
      const scope : string = params['scope'];
      if (code !== undefined) {
        if (state !== undefined && state === 'withings') {
          // console.log('Withings detected');
          this.doWithingsSetup(code, state);
        }
        if (scope !== undefined && (scope.includes('https://www.googleapis.com'))) {
          console.log(code)
          console.log(scope)
          this.doGoogleSetup(code, scope);
        }
      }
    });
    this.http.get(this.smart.epr + '/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/administrative-gender').subscribe(result => {
      this.administrativeGenders = this.smart.getContainsExpansion(result)
      this.setGenders()
    })
    this.http.get(this.smart.epr + '/ValueSet/$expand?url=https://fhir.hl7.org.uk/ValueSet/UKCore-EthnicCategory').subscribe(result => {

      this.ethnicCategories = this.smart.getContainsExpansion(result)
      if (this.epr.person !== undefined && this.epr.person.ethnic !== undefined) {
        for (var ethnic of this.ethnicCategories) {
          if (this.epr.person.ethnic === ethnic.code) {
            this.ethnicCategory = ethnic
          }
        }
      }
    })

    if (this.epr.person.maximumHR !== undefined) {
      this.maximumHR = this.epr.person.maximumHR
      this.zoneHR = this.epr.getHRZone()
    }
    if (this.epr.person.restingHR !== undefined) {
      this.restingHR = this.epr.person.restingHR
    }
    if (this.restingHR == undefined) {
      this.restingHR = 60
    }
    if (this.epr.person.age !== undefined) {
      this.age = this.epr.person.age
    }
    if (this.epr.person.height !== undefined) {
      this.height = this.epr.person.height
    }
    if (this.epr.person.weight !== undefined) {
      this.weight = this.epr.person.weight
    }
    if (this.epr.person.waist !== undefined) {
      this.waist = this.epr.person.waist
    }
    if (this.epr.person.ftp !== undefined) {
      this.ftp = this.epr.person.ftp
      this.zonePWR = this.epr.getPWRZone()
    }
    this.getStrava()
    this.strava.tokenChange.subscribe(()=> {
      this.getStrava()
    })


  }

  getStrava(){
    // token changed so clear results
    this.strava.getAthlete().subscribe(athlete => {
     // if (athlete.weight !== undefined) this.weight = athlete.weight
      this.epr.setPerson(athlete)
    })
  }

  calculate() {
    if (this.age !== undefined && this.age !== this.epr.person.age) {
      this.epr.setAge(this.age)
    }
    if (this.height !== undefined && this.height !== this.epr.person.height) {
      this.epr.setHeight(this.height)
    }
    if (this.weight !== undefined && this.weight !== this.epr.person.weight) {
      this.epr.setWeight(this.weight)
    }
    if (this.waist !== undefined && +this.waist > 0) {
      this.epr.setWaist(this.waist)
    }

    if (this.ethnicCategory !== undefined && this.ethnicCategory.code !== undefined) {
      this.epr.setEthnic(this.ethnicCategory.code)
    }

    if (this.maximumHR !== undefined && this.maximumHR !== this.epr.person.maximumHR) {
      this.epr.setMaximumHR(this.maximumHR)
      this.zoneHR = this.epr.getHRZone()
    }
    if (this.restingHR !== undefined && this.restingHR !== this.epr.person.restingHR) {
      this.epr.setRestingHR(this.restingHR)
    }
    if (this.epr.person.maximumHR === undefined && this.age !== undefined) {
      console.log('age generated change')
      let zone = 220 - this.age
      this.maximumHR = this.round(zone)
      if (zone !== undefined) {
        this.epr.setMaximumHR(zone)
      }
    }
    if (this.zonePWR === undefined && this.epr.person.ftp !== undefined) {
      this.ftp =this.epr.person.ftp
      this.zonePWR = this.epr.getPWRZone()
    }
    this.setGenders()
  }
  setGenders() {
    if (this.administrativeGenders !== undefined && this.epr.person.sex !== undefined) {
      for (var gender of this.administrativeGenders) {

        if (gender.code === 'male' && this.epr.person.sex === 'M') {
          this.administrativeGender = gender
        }
        if (gender.code === 'female' && this.epr.person.sex === 'F') {
          this.administrativeGender = gender
        }
      }
    }
  }
  getBackgroundPWRZone(zone: number) {
    return this.epr.getFTPColours()[zone-1]
  }
  round(val : number | undefined) {
    if (val == undefined) return 0
    return Math.round(val)
  }

  connectWithings(): void {
    console.log(window.location.origin);
    this.withings.authorise(window.location.origin + this.getPathName(window.location.pathname) );
  }
  getPathName(pathname: string): string {
    console.log(pathname)
    if (pathname.includes('FHIR-R4')) return "/FHIR-R4-Demonstration";
    return pathname;
  }

  doWithingsSetup(authorisationCode: string, state: any): void {

    //  console.log(authorisationCode);
    this.withings.tokenChange.subscribe(
        (value) => {
          this.router.navigateByUrl('/summary');
          console.log(value)
        }
    );
    const url = window.location.href.split('?');
    this.withings.getOAuth2AccessToken(authorisationCode, url[0]);
  }
  private doGoogleSetup(authorisationCode: any, scope: string) {
    //  console.log(authorisationCode);
    this.googleFit.tokenChange.subscribe(
        (value) => {
          this.router.navigateByUrl('/summary');
          console.log(value)
        }
    );
    const url = window.location.href.split('?');
    this.googleFit.getOAuth2AccessToken(authorisationCode, url[0]);
  }

  withingsConnected() {
    if (this.withings.getAccessToken() !== undefined) return true
    return false
  }

  disconnectWithings() {
    this.withings.clearLocalStore()
  }

  disconnecGoogleFit() {
    this.googleFit.clearLocalStore()
  }

  googleFitConnected() {
    if (this.googleFit.getAccessToken() !== undefined) return true
    return false
  }

  connectGoogleFit() {
    console.log(window.location.origin);
    this.googleFit.authorise(window.location.origin + this.getPathName(window.location.pathname) );
  }


}
