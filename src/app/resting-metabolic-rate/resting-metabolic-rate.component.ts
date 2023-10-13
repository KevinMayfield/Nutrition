import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {Parameters, QuestionnaireResponse, ValueSetExpansionContains} from "fhir/r4";
import {HttpClient} from "@angular/common/http";
import {SmartService} from "../service/smart.service";
import {DomSanitizer} from "@angular/platform-browser";
import {StravaService} from "../service/strava.service";
import {hrZone, Person} from "../models/person";
import {SummaryActivity} from "../models/summary-activity";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {LiveAnnouncer} from "@angular/cdk/a11y";
import {MatSort, Sort} from "@angular/material/sort";
import {ActivityType} from "../models/activity-type";
import {EPRService} from "../service/epr.service";

class sessions {
    type?: ActivityType;
    name: string = "";
}
class activityDay {
    duration: number = 0;
    kcal: number = 0;
    average_heartrate?: number;
    hr_max?: number;
    sessions: sessions[] = [];
}
class activityWeek {
    week?: number;
    avg_duration: number = 0;
    avg_kcal: number = 0;
    average_heartrate?: number;
    hr_max?: number;
    num_activities: number = 0;
}

@Component({
  selector: 'app-resting-metabolic-rate',
  templateUrl: './resting-metabolic-rate.component.html',
  styleUrls: ['./resting-metabolic-rate.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class RestingMetabolicRateComponent implements OnInit{
    height: number | undefined;
    weight: number | undefined;
    rmr: number | undefined;
    dailyEnergy: number | undefined
    age: any;
    exerciseLevel: number = 0;
    exerciseDurationTotal: number = 0;
    zoneHR: hrZone | undefined

    administrativeGenders: ValueSetExpansionContains[] | undefined;
    administrativeGender :ValueSetExpansionContains | undefined
    activityArray : activityDay[] = []
    exerciseIntenses: ValueSetExpansionContains[] = [
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
    exerciseIntense :ValueSetExpansionContains | undefined
    activities : SummaryActivity[] = []
    powerActivities: SummaryActivity[] = [];
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
    maximumHR: undefined | number;
    activitiesWeek : activityWeek[] = Array(5)
    // @ts-ignore
    dataSourceWeek: MatTableDataSource<activityWeek>;
    // @ts-ignore
    dataSourceHR: MatTableDataSource<SummaryActivity> ;
    // @ts-ignore
    dataSourceKJ: MatTableDataSource<SummaryActivity> ;
    @ViewChild(MatSort) sort: MatSort | null | undefined;
    @ViewChild(MatPaginator) paginator: MatPaginator | undefined;
    displayedColumnsHR = ['date', 'type','duration', 'Z1', 'Z2', 'Z3', 'Z4','Z5', 'avghr', 'peakhr', 'kcal']
    displayedColumnsKJ = ['date', 'type','duration', 'z1', 'z2', 'z3', 'z4','z5', 'z6', 'z7', 'z8', 'z9', 'z10', "kJ"]
    displayedColumnsWeek = [ "week", "kJ", "duration", "hr", "activeDay"]

    opened: boolean = true;
    hasPowerData: boolean = false;
    constructor(
        private http: HttpClient,
        private epr: EPRService,
        private smart: SmartService,
        private strava: StravaService,
        protected sanitizer: DomSanitizer,
        private _liveAnnouncer: LiveAnnouncer) {
       // this.sanitizer.bypassSecurityTrustHtml("<mat-icon>local_pizza</mat-icon>")
        for (let i = 0; i < this.activitiesWeek.length; i++) {
            this.activitiesWeek[i] = {
                week: i, avg_duration: 0, avg_kcal: 0, num_activities: 0
            }
        }
        console.log(this.activitiesWeek)
    }
    calculate() {
        if (this.age !== undefined && this.age !== this.epr.person.age) {
            this.epr.setAge(this.age)
        }
        if (this.height !== undefined && this.height !== this.epr.person.height) {
            this.epr.setHeight(this.height)
        }

        if (((this.epr.person.hrzones === undefined || this.epr.person.hrzones.calculated)) && this.age !== undefined) {
            let zone = 220 - this.age
            if (zone !== undefined) {
                this.epr.setHRZone( {
                    calculated: true,
                    maximumHR: this.round(zone),
                    z1: {
                        min: Math.round(zone * 0.5),
                        max: Math.round(zone * 0.6)
                    },
                    z2: {
                        min: Math.round(zone * 0.6),
                        max: Math.round(zone * 0.7)
                    },
                    z3: {
                        min: Math.round(zone * 0.7),
                        max: Math.round(zone * 0.8)
                    },
                    z4: {
                        min: Math.round(zone * 0.8),
                        max: Math.round(zone * 0.9)
                    },
                    z5: {
                        min: Math.round(zone * 0.9),
                        max: Math.round(zone * 1.0)
                    }
                })
            }

        }
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

        this.http.get(this.smart.epr + '/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/administrative-gender').subscribe(result => {
            this.administrativeGenders = this.smart.getContainsExpansion(result)
        })


        this.zoneHR = this.epr.person.hrzones
        this.epr.zoneChange.subscribe(zone => {
            console.log('hr zone change')
            this.zoneHR = zone
        })
        if (this.epr.person.age !== undefined) {
            this.age = this.epr.person.age
        }
        if (this.epr.person.height !== undefined) {
            this.height = this.epr.person.height
        }
        if (this.epr.person.weight !== undefined) {
            this.weight = this.epr.person.weight
        }
        if (this.height !== undefined || this.weight !== undefined) this.calculate()
        this.getStrava()
        this.strava.tokenChange.subscribe(()=> {
            this.getStrava()
        })

        this.strava.loaded.subscribe(activity => {

            var today = new Date();
            var activityDate = new Date(activity.start_date)
            var diff = Math.abs(today.getTime() - activityDate.getTime());
            var diffDays = Math.ceil(diff / (1000 * 3600 * 24));

            if (activity.kcal !== undefined) {
                let week = Math.floor((this.strava.duration - diffDays) / 7)
                console.log(week)


                  // @ts-ignore
                if (activity.max_heartrate !== undefined && (this.activitiesWeek[week].hr_max === undefined || this.activitiesWeek[week].hr_max < activity.max_heartrate)) {
                      this.activitiesWeek[week].hr_max = activity.max_heartrate
                  }
                this.activitiesWeek[week].avg_duration = ((this.activitiesWeek[week].avg_duration * this.activitiesWeek[week].num_activities) + activity.elapsed_time) / (this.activitiesWeek[week].num_activities + 1)
                this.activitiesWeek[week].avg_kcal = ((this.activitiesWeek[week].avg_kcal * this.activitiesWeek[week].num_activities) + activity.kcal) / (this.activitiesWeek[week].num_activities + 1)
                if (this.activityArray[this.strava.duration - diffDays].duration ===0 ) {
                    this.activitiesWeek[week].num_activities = 1 + this.activitiesWeek[week].num_activities
                }
                  console.log(this.activitiesWeek)
                this.dataSourceWeek = new MatTableDataSource<activityWeek>(this.activitiesWeek)

                var act : activityDay = {
                    duration: (activity.elapsed_time + this.activityArray[this.strava.duration - diffDays].duration),
                    kcal: (this.activityArray[this.strava.duration - diffDays].kcal + activity.kcal),
                    sessions: this.activityArray[this.strava.duration - diffDays].sessions
                }
                if (activity.average_heartrate !== undefined) {
                    if (this.activityArray[this.strava.duration - diffDays].average_heartrate !== undefined) {

                        // @ts-ignore
                        act.average_heartrate = ((activity.average_heartrate * activity.elapsed_time) + (this.activityArray[this.strava.duration - diffDays].average_heartrate * this.activityArray[this.strava.duration - diffDays].duration)) / (this.activityArray[this.strava.duration - diffDays].duration + activity.elapsed_time)
                    } else {
                        act.average_heartrate = activity.average_heartrate
                    }
                }
                // @ts-ignore
                if (activity.max_heartrate !== undefined && (this.activityArray[this.strava.duration - diffDays].hr_max === undefined || (this.activityArray[this.strava.duration - diffDays].hr_max < activity.max_heartrate))) {
                    act.hr_max = activity.max_heartrate
                }


                var session : sessions = {
                    name: activity.name
                }
                if (activity.zones !== undefined && (this.epr.person.hrzones === undefined || this.epr.person.hrzones?.calculated)) {
                    this.getZone(activity)
                }
                if (activity.type !== undefined) session.type = activity.type
                act.sessions.push(session)
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
                // supports activity detail
                this.activities.push(activity)
                if (activity.device_watts) {
                    this.hasPowerData = true
                    this.powerActivities.push(activity)
                    this.dataSourceKJ = new MatTableDataSource<SummaryActivity>(this.powerActivities.sort((a,b) =>{
                        if (a.start_date < b.start_date) {
                            return 1;
                        }

                        if (a.start_date > b.start_date) {
                            return -1;
                        }

                        return 0;
                    }));
                }
                this.dataSourceHR = new MatTableDataSource<SummaryActivity>(this.activities.sort((a,b) =>{
                    if (a.start_date < b.start_date) {
                        return 1;
                    }

                    if (a.start_date > b.start_date) {
                        return -1;
                    }

                    return 0;
                }));
                this.setSort()
            }

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

        if (this.sort !== undefined && this.sort !== null) {
            this.sort.sortChange.subscribe((event) => {
                 console.log(event);
            });

            if (this.dataSourceHR !== undefined) this.dataSourceHR.sort = this.sort;
        } else {
            console.log('SORT UNDEFINED');
        }

    }

    setSort() {

        // @ts-ignore
        this.dataSourceHR.sort = this.sort

        this.dataSourceHR.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'date': {
                    if (item.start_date !== undefined) {
                        try {
                        return item.start_date.getDate()
                        }
                        catch (e) {
                            console.log(item.start_date)
                            return new Date(item.start_date).getDate()

                        }

                    }
                    return 0;
                }
                case 'duration': {
                   return item.elapsed_time
                }
                case 'type': {
                    return item.type
                }
                case 'Z1': {
                    return this.getZoneHRDuration(item,1)
                }
                case 'Z2': {
                    return this.getZoneHRDuration(item,2)
                }
                case 'Z3': {
                    return this.getZoneHRDuration(item,3)
                }
                case 'Z4': {
                    return this.getZoneHRDuration(item,4)
                }
                case 'Z5': {
                    return this.getZoneHRDuration(item,5)
                }
                case 'avghr': {
                    return item.average_heartrate
                }
                case 'peakhr': {
                    return item.max_heartrate
                }
                case 'kcal': {
                    return item.kcal
                }
                default: {
                    return 0
                }
            }
        };
    }

    getStrava(){
        for(var i= 0;i<=this.strava.duration;i++) this.activityArray.push({ duration:0,kcal: 0, sessions: []})
        this.strava.getAthlete().subscribe(athlete => {
            if (athlete.weight !== undefined) this.weight = athlete.weight
            this.epr.setPerson(athlete)
            this.strava.getActivities()
        })
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
            for (let intense of this.exerciseIntenses) {
                if (intense.code === pal) {

                    this.exerciseIntense = intense
                }
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
        if (number === undefined || number === 0 || isNaN(+number)) return undefined
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



    announceSortChange(sortState: Sort) {
        if (sortState.direction) {
            this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
        } else {
            this._liveAnnouncer.announce('Sorting cleared');
        }
    }


    dayOfWeek(number: number) {
        var now = new Date();
        var from = new Date();
        from.setDate(now.getDate() - this.strava.duration + number );
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        return days[ from.getDay() ];
    }

    getBackground(heartrate: number | undefined) {
        return this.epr.getBackground(heartrate)
    }

    getType(type: ActivityType | undefined) {
        switch(type) {
            case ActivityType.Ride, ActivityType.VirtualRide : {
                return 'directions_bike'
            }
            case ActivityType.Walk : {
                return 'directions_walk'
            }
            case ActivityType.Run : {
                return 'directions_run'
            }
        }
        return 'exercise'
    }

    getNames(activity: activityDay) {
        var result = ''
        for (var session of activity.sessions) result = result + ' ' + session.name
        return result
    }

    getZoneHRDuration(activity: any, number: number) {
        if (activity === undefined || activity.zones == undefined || activity.zones.length == 0) return undefined
      //  console.log(activity.zones.length)
        for (let zone of activity.zones) {
            if (zone.type ==='heartrate') {
                if (zone.distribution_buckets.length>4) return zone.distribution_buckets[number-1].time
            } else {
                console.log(zone.type)
            }
        }
        return undefined
    }
    getZoneKJDuration(activity: any, number: number) {
        if (activity === undefined || activity.zones == undefined || activity.zones.length == 0) return undefined
        //  console.log(activity.zones.length)
        for (let zone of activity.zones) {
            if (zone.type ==='power') {
                if (zone.distribution_buckets.length>4) return zone.distribution_buckets[number].time
            } else {
          //      console.log(zone.type)
            }
        }
        return undefined
    }



    getZone(activity: any) {
        if (activity === undefined || activity.zones == undefined || activity.zones.length == 0) return
        for (let zone of activity.zones) {
            if (zone.type ==='heartrate') {
                console.log(zone)
                var hrzones : hrZone = {
                    calculated: false,
                    maximumHR: Math.round(1.034 * zone.distribution_buckets[4].min)
                }
                hrzones.z1 = {
                    min : zone.distribution_buckets[0].min,
                    max: zone.distribution_buckets[0].max
                }
                hrzones.z2 = {
                    min : zone.distribution_buckets[1].min,
                    max: zone.distribution_buckets[1].max
                }
                hrzones.z3 = {
                    min : zone.distribution_buckets[2].min,
                    max: zone.distribution_buckets[2].max
                }
                hrzones.z4 = {
                    min : zone.distribution_buckets[3].min,
                    max: zone.distribution_buckets[3].max
                }
                hrzones.z5 = {
                    min : zone.distribution_buckets[4].min,
                    max: zone.distribution_buckets[4].max
                }
                console.log('I don this shit')
                this.epr.setHRZone(hrzones)
            } else {
                console.log(zone.type)
            }
        }
    }

    viewPA() {
        window.open("https://build.fhir.org/ig/HL7/physical-activity/measures.html", "_blank")
    }

    viewPower() {
        window.open("https://power-meter.cc/", "_blank")
    }
}
