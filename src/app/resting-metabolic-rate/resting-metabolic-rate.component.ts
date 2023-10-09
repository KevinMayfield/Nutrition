import {Component, OnInit, ViewChild} from '@angular/core';
import {Parameters, QuestionnaireResponse, ValueSetExpansionContains} from "fhir/r4";
import {HttpClient} from "@angular/common/http";
import {SmartService} from "../service/smart.service";
import {DomSanitizer} from "@angular/platform-browser";
import {StravaService} from "../service/strava.service";
import {Athlete} from "../service/models/athlete";
import {SummaryActivity} from "../service/models/summary-activity";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {LiveAnnouncer} from "@angular/cdk/a11y";
import {MatSort, Sort} from "@angular/material/sort";


class activity {
    duration: number = 0;
    kcal: number = 0;
    hr_avg?: number;
    hr_max?: number
}
@Component({
  selector: 'app-resting-metabolic-rate',
  templateUrl: './resting-metabolic-rate.component.html',
  styleUrls: ['./resting-metabolic-rate.component.scss']
})
export class RestingMetabolicRateComponent implements OnInit{
    height: number | undefined;
    weight: number | undefined;
    rmr: number | undefined;
    dailyEnergy: number | undefined
    age: any;
    exerciseLevel: number = 0;
    exerciseDurationTotal: number = 0;
    athlete: Athlete | undefined;
    administrativeGenders: ValueSetExpansionContains[] | undefined;
    administrativeGender :ValueSetExpansionContains | undefined
    activityArray : activity[] = []
    pals: ValueSetExpansionContains[] = [
        {
            code: 'very-light',
            display: 'Very light training (low intensity or skill based training)'
        },
        {
            code: 'moderate',
            display: 'Moderate-intensity training (approx 1 h daily)'
        },
        {
            code: 'moderate-high',
            display: 'Moderate-high-intensity training (approx 1-3 h daily)'
        },
        {
            code: 'very-high',
            display: 'Very high-intensity training (> 4 h daily)'
        }
    ]
    pal :ValueSetExpansionContains | undefined
    activities : SummaryActivity[] = []
    exerciseFrequencies: ValueSetExpansionContains[] = [
        {
            code: '1.2',
            display: 'Mostly inactive or sedentary (mainly sitting)'
        },
        {
            code: '1.3',
            display: 'Fairly active (include walking and exercise 1-2 x week)'
        },
        {
            code: '1.4',
            display: 'Moderate active (exercise 2-3 x weekly)'
        },
        {
            code: '1.5',
            display: 'Active (exercise hard more than 3 x weekly)'
        },
        {
            code: '1.7',
            display: 'Very active (exercise hard daily)'
        }
    ]
    exerciseFrequency :ValueSetExpansionContains | undefined
    fluidAdvice =  'Weigh yourself before and after an one hour exercise in kilograms. The difference will indicate how much sweat you have lost during exercise. 1 kg =  1000 ml sweat loss, so if you have lost .75 kg you have lost 750 ml of fluid and so you need to drink 750 ml per hour.';
    protected readonly Math = Math;
    // @ts-ignore
    dataSource: MatTableDataSource<SummaryActivity> ;
    @ViewChild(MatSort) sort: MatSort | undefined;
    @ViewChild(MatPaginator) paginator: MatPaginator | undefined;
    displayedColumns = ['date', 'name', 'kcal', 'duration', 'rate']
    constructor(
        private http: HttpClient,
        private smart: SmartService,
        private strava: StravaService,
        protected sanitizer: DomSanitizer,
        private _liveAnnouncer: LiveAnnouncer) {
       // this.sanitizer.bypassSecurityTrustHtml("<mat-icon>local_pizza</mat-icon>")
    }
    calculate() {
        if (this.administrativeGenders !== undefined && this.athlete !== undefined && this.athlete.sex !== undefined) {
            for (var gender of this.administrativeGenders) {

                if (gender.code === 'male' && this.athlete.sex === 'M') {
                    this.administrativeGender = gender
                }
                if (gender.code === 'female' && this.athlete.sex === 'F') {
                    this.administrativeGender = gender
                }
            }
        }
        if (this.weight != undefined
            && this.height != undefined
            && this.administrativeGender !== undefined) {
            this.rmr = (this.weight * 10) + (6.25 * this.height)
            if (this.administrativeGender.code == 'male') {
                this.rmr = this.rmr - (5 * this.age) + 5
            } else {
                this.rmr = this.rmr - (5 * this.age) - 16
            }
            if (this.exerciseFrequency !== undefined) {
                // @ts-ignore
                this.dailyEnergy = this.rmr * (+this.exerciseFrequency.code)
            }
        }
    }

    ngOnInit(): void {
        var today = new Date();
        for(var i= 0;i<=this.strava.duration;i++) this.activityArray.push({ duration:0,kcal: 0})

        this.http.get(this.smart.epr + '/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/administrative-gender').subscribe(result => {
            this.administrativeGenders = this.smart.getContainsExpansion(result)

        })
        this.athlete = this.strava.getTokenAthlete()
        this.strava.getAthlete().subscribe(athlete => {
            if (athlete.weight !== undefined) this.weight = athlete.weight
            this.athlete = athlete
            this.strava.getActivities()
        })

        this.strava.loaded.subscribe(activity => {
            this.activities.push(activity);
            var activityDate = new Date(activity.start_date)
            var diff = Math.abs(today.getTime() - activityDate.getTime());
            var diffDays = Math.ceil(diff / (1000 * 3600 * 24));

            if (activity.kcal !== undefined) {
                var act : activity = {
                    duration: (activity.elapsed_time + this.activityArray[this.strava.duration - diffDays].duration),
                    kcal: (this.activityArray[this.strava.duration - diffDays].kcal + activity.kcal)
                }
                if (activity.average_heartrate !== undefined) act.hr_avg = activity.average_heartrate
                if (activity.max_heartrate !== undefined) act.hr_max = activity.max_heartrate
                this.activityArray[this.strava.duration - diffDays] = act
                this.exerciseLevel = 0
                this.exerciseDurationTotal = 0
                for(let activity of this.activityArray) {
                    // be a bit generous on amount of exercise for calculation
                    if (activity.duration > (40 * 60)) {
                        this.exerciseLevel++
                        this.exerciseDurationTotal = this.exerciseDurationTotal + activity.duration
                    }
                }
                this.setSelectAnswers()
            }
         //   this.dataSource = new MatTableDataSource<SummaryActivity>(this.activities);
         //   this.setSortAndPaginator()
        })
        this.smart.patientChangeEvent.subscribe(patient => {
                this.age = this.smart.age

            this.setSelectAnswers()
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
                                        }
                                    }
                                }
                            }

                            this.calculate()
                        }
                    }
                })
            }
        )
    }

    ngAfterViewInit(): void {
        if (this.sort !== undefined) {
            this.sort.sortChange.subscribe((event) => {
                 console.log(event);
            });
            // @ts-ignore
            this.sort.sort(({ id: 'date', start: 'desc'}) as MatSortable);
            if (this.dataSource !== undefined) this.dataSource.sort = this.sort;
        } else {
            console.log('SORT UNDEFINED');
        }
    }
    /*
    setSortAndPaginator() {
        // @ts-ignore
        this.dataSource.sort = this.sort
        if (this.paginator !== undefined) this.dataSource.paginator = this.paginator;
        // @ts-ignore
        this.dataSource.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'date': {
                    if (item.start_date !== undefined) {
                        return item.start_date
                    }
                    return undefined;
                }
                default: {
                    return undefined
                }
            }
        };
    }
*/
    setSelectAnswers() {
        if (this.smart.patient !== undefined) {
            if (this.administrativeGenders !== undefined) {
                for (var gender of this.administrativeGenders) {

                    if (gender.code === this.smart.patient.gender) {
                        this.administrativeGender = gender
                    }
                }
            }
        }
        if (this.exerciseLevel > 0) {
            let level = Math.round(this.exerciseLevel * 7 / (this.strava.duration+1))
            let duration = this.exerciseDurationTotal / this.exerciseLevel / 60
            for(let pal of this.exerciseFrequencies) {
                if (pal.code == '1.2' && level < 1) this.exerciseFrequency = pal
                if (pal.code == '1.3' && level >= 1 && level <= 2 ) this.exerciseFrequency = pal
                if (pal.code == '1.4' && level > 2 && level <= 3 ) this.exerciseFrequency = pal
                if (pal.code == '1.5' && level > 3 && level <= 6 ) this.exerciseFrequency = pal
                if (pal.code == '1.6' && level > 6  ) this.exerciseFrequency = pal
            }
            var pal = 'very-light'
            if (level >= 4) {
                if (duration>50) pal = 'moderate'
                if (duration>65) pal = 'moderate-high'
                if (duration>180) pal = 'very-high'
            }
            for (let actLevel of this.pals) {
                if (actLevel.code = pal) this.pal = actLevel
            }
            this.calculate()
        }
    }
    round(val : number | undefined) {
        if (val == undefined) return undefined
        return Math.round(val)
    }

    perkgKCal(number: number) {
        if (this.weight === undefined) return undefined
        return Math.round(number * this.weight)
    }
    perKgMl(number: number) {
        if (this.weight === undefined) return undefined
        return Math.round(number * this.weight)
    }

    pizza(kcal: number | undefined) {
        if (kcal === undefined || kcal === 0) return undefined

        // Using zwift pizza units https://www.bikeradar.com/advice/fitness-and-training/how-to-read-a-zwift-ride-report
        var number= Math.round(kcal/285)

        return new Array(number).fill(0)
            .map((n, index) => index + 1);
    }


    slicesPerHour(kcal: number | undefined, elapsed_time: number) {
        if (elapsed_time === undefined || elapsed_time == 0) return undefined
        if (kcal === undefined) return undefined
        return Math.round((kcal * (elapsed_time)/3600)/28)/10
    }
    slices(kcal: number | undefined) {
        if (kcal === undefined) return undefined
        return Math.round(kcal/28)/10
    }


/*
    announceSortChange(sortState: Sort) {
        if (sortState.direction) {
            this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
        } else {
            this._liveAnnouncer.announce('Sorting cleared');
        }
    }
*/
    dayOfWeek(number: number) {
        var now = new Date();
        var from = new Date();
        from.setDate(now.getDate() - number );
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        return days[ from.getDay() ];
    }

    getBackground(activity: activity) {
        if (this.age !== undefined && activity.hr_avg !== undefined) {
            let zone = 220 - this.age
            console.log(zone)
            if ((zone * 0.9) < activity.hr_avg) return "background: lightpink"
            if ((zone * 0.8) < activity.hr_avg) return "background: lightyellow"
            if ((zone * 0.7) < activity.hr_avg) return "background: lightgreen"
            if ((zone * 0.6) < activity.hr_avg) return "background: lightblue"
        }
        return "background: lightgrey"
    }
}
