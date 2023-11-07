import {Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import {Parameters, QuestionnaireResponse, ValueSetExpansionContains} from "fhir/r4";
import {HttpClient} from "@angular/common/http";
import {SmartService} from "../service/smart.service";
import {DomSanitizer} from "@angular/platform-browser";
import {StravaService} from "../service/strava.service";
import {hrZone, pwrZone} from "../models/person";
import {SummaryActivity} from "../models/summary-activity";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {LiveAnnouncer} from "@angular/cdk/a11y";
import {MatSort, Sort} from "@angular/material/sort";
import {ActivityType} from "../models/activity-type";
import {EPRService} from "../service/epr.service";
import {ActivityDay, ActivitySession} from "../models/activity-day";
import {MatDatepickerInputEvent} from "@angular/material/datepicker";
import {Color, ScaleType} from "@swimlane/ngx-charts";
import {WithingsService} from "../service/withings.service";
import {Observations} from "../models/observations";
import {MeasurementSetting} from "../models/enums/MeasurementSetting";
import {curveCatmullRom} from "d3-shape";

class ActivityWeek {
    week?: number;
    duration: number = 0;
    kcal: number = 0;
    num_activities: number = 0;
    zones: DaySummary[] =[]
}

class DaySummary {
    kcal?: number = 0;
    duration: number = 0;
    zone?: number;
    num_activities?: number = 0;
}

@Component({
  selector: 'app-resting-metabolic-rate',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ActivityComponent implements OnInit{

    colorScheme: Color = {
        domain: ['#7aa3e5','#5AA454', '#A10A28', '#C7B42C', '#AAAAAA'],
        group: ScaleType.Ordinal,
        name: "",
        selectable: false
    }
    @Input()
    widthQuota: number = 2;
    viewEnergyPie:  [number, number] = [500, 200];
    energy= [{
        "name": "Base Metabolic Rate",
        "value": 0
    },
    {
        "name": "Daily Calorie Needs",
        "value": 0
    }];

    height: number | undefined;
    weight: number | undefined;
    rmr: number | undefined;
    dailyEnergy: number | undefined
    age: any;
    restingHR: any;
    maximumHR: undefined | number;
    exerciseLevel: number = 0;
    exerciseDurationTotal: number = 0;
    zoneHR: hrZone | undefined
    zonePWR: pwrZone | undefined
    administrativeGenders: ValueSetExpansionContains[] | undefined;
    administrativeGender :ValueSetExpansionContains | undefined
    activityArray : ActivityDay[] = []
    activities : SummaryActivity[] = []
    activitiesWeek : ActivityWeek[] = []
    powerActivities: SummaryActivity[] = [];
    sleepMeasures: Observations[] = []
    bodyMeasures: Observations[] = []
    legendHR = true;
    exerciseEnergy= [
        {
            "name": "Lower Intake",
            "value": 8940000
        },
        {
            "name": "Upper Intake",
            "value": 5000000
        }
    ];
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
   protected readonly Math = Math;
    registered = "Normalized Power®, Training Stress Score® & Intensity Factor® are TrainingPeaks® registered trademarks"

    // @ts-ignore
    dataSourceHR: MatTableDataSource<SummaryActivity> ;
    // @ts-ignore
    dataSourceKJ: MatTableDataSource<SummaryActivity> ;
    @ViewChild('hrSort') hrSort: MatSort | null | undefined;
    @ViewChild('pwrSort') pwrSort: MatSort | null | undefined;
    @ViewChild('paginatorHR',) paginatorHR: MatPaginator | undefined;
    @ViewChild('paginatorKJ',) paginatorKJ: MatPaginator | undefined;
    displayedColumnsHR = ['date', 'heart']
   // displayedColumnsHR = ['date', 'type', 'heart', 'avghr', 'peakhr','duration', 'kcal', 'cadence']
    displayedColumnsKJ = ['date', "power"]
  //  displayedColumnsKJ = ['date', "power",'type','avgpwr','avghr', 'duration',"kcal",  "cadence"]
    opened: boolean = true;
    hasPowerData: boolean = false;

    @Input()
    endDate: Date = new Date();
    selectedTabIndex: any;
    ftp: number | undefined;

    /* PIE */

    multiHR: any[] | undefined;
    multiPWR: any[] | undefined;
    yScaleMax =0;
    stacked: any[] | undefined;
    gradient = false;

    colorFTP: Color = {
        domain: this.epr.getFTPColours(),
        group: ScaleType.Ordinal,
        name: "",
        selectable: false
    }

    colorStacked: Color = {
        domain: [
            'lightgrey', 'lightblue', 'lightgreen', 'lightsalmon', 'lightpink'
        ], group: ScaleType.Ordinal, name: "", selectable: false
    }

    colorSingle: Color = {
        domain: [
            'lightgrey', 'lightblue', 'lightgreen', 'lightsalmon', 'lightpink'
        ], group: ScaleType.Ordinal, name: "", selectable: false
    }


    constructor(
        private http: HttpClient,
        private epr: EPRService,
        private smart: SmartService,
        private strava: StravaService,
        private withings: WithingsService,
        protected sanitizer: DomSanitizer,
        private _liveAnnouncer: LiveAnnouncer) {
        this.viewEnergyPie = [innerWidth / this.widthQuota, this.viewEnergyPie[1]];
    }

    ngOnInit(): void {
        this.strava.endWeekChanged.subscribe(()=>{
            this.endDate = this.strava.getToDate()
            this.getStrava()
            this.getWithings()
        })
        this.http.get(this.smart.epr + '/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/administrative-gender').subscribe(result => {
            this.administrativeGenders = this.smart.getContainsExpansion(result)
            this.setGenders()
        })
        if (this.epr.person !== undefined && this.epr.person.ftp !== undefined) {
            this.colorFTP.domain = this.epr.getFTPColours()
        }

        this.zoneHR = this.epr.getHRZone()

        this.epr.zoneChange.subscribe(zone => {
            console.log('hr zone change')
            this.zoneHR = zone
            this.maximumHR = this.zoneHR?.maximumHR
            this.getStrava()
        })
        if (this.epr.person.maximumHR !== undefined) {
            this.maximumHR = this.epr.person.maximumHR
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
        if (this.height !== undefined || this.weight !== undefined) {
            this.opened = false
            this.calculate()
        }
        this.getStrava()
        if (this.withings.getAccessToken() !== undefined) {
            this.getWithings()
        }
        this.withings.tokenChange.subscribe(() => {
            console.log('New Withings token - getData()')
            this.getWithings()
        })
        this.strava.tokenChange.subscribe(()=> {
            console.log('New Strava token - getData()')
            this.getStrava()

        })


        this.strava.loaded.subscribe(activity => {

            var today = this.epr.getDateAbs(this.strava.getToDate())
            var activityDate = new Date(activity.start_date)
            var diffDays = (today) - this.epr.getDateAbs(activityDate);
            let bank = this.activityArray[this.strava.duration - diffDays]
            if (bank == undefined) {
                console.log(this.strava.getToDate() + ' ' + diffDays + activity.start_date)
            } else {
                if (activity.kcal !== undefined) {
                    activity.zones = this.epr.getZonesAndCalculateScores(activity)
                    var act: ActivityDay = {
                        duration: (activity.elapsed_time + bank.duration),
                        kcal: (bank.kcal + activity.kcal),
                        sessions: bank.sessions,
                        day: activityDate
                    }
                    if (activity.average_heartrate !== undefined) {
                        if (bank.average_heartrate !== undefined) {

                            // @ts-ignore
                            act.average_heartrate = ((activity.average_heartrate * activity.elapsed_time) + (bank.average_heartrate * bank.duration)) / (bank.duration + activity.elapsed_time)
                        } else {
                            act.average_heartrate = activity.average_heartrate
                        }
                    }
                    // @ts-ignore
                    if (activity.max_heartrate !== undefined && (bank.hr_max === undefined || (bank.hr_max < activity.max_heartrate))) {
                        act.hr_max = activity.max_heartrate
                    }


                    var session: ActivitySession = {
                        name: activity.name,
                        activity: activity
                    }
                    /*
                    if (activity.zones !== undefined && (this.epr.person.hrzones === undefined || this.epr.person.hrzones?.calculated)) {
                        this.getZone(activity)
                    }
                     */
                    if (activity.type !== undefined) session.type = activity.type
                    act.sessions.push(session)
                    this.activityArray[this.strava.duration - diffDays] = act
                    this.exerciseLevel = 0
                    this.exerciseDurationTotal = 0
                    for (let activity of this.activityArray) {
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
                        this.dataSourceKJ = new MatTableDataSource<SummaryActivity>(this.powerActivities.sort((a, b) => {
                            if (a.start_date < b.start_date) {
                                return 1;
                            }

                            if (a.start_date > b.start_date) {
                                return -1;
                            }

                            return 0;
                        }));
                    }
                    // force a change
                    var tempAct: any[] = []
                    for (let temp of this.activityArray) tempAct.push(temp)
                    this.activityArray = tempAct

                    this.dataSourceHR = new MatTableDataSource<SummaryActivity>(this.activities.sort((a, b) => {
                        if (a.start_date < b.start_date) {
                            return 1;
                        }

                        if (a.start_date > b.start_date) {
                            return -1;
                        }

                        return 0;
                    }));
                    this.setSortHR()
                    this.setSortPWR()
                    this.refreshActivity()
                }
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
        this.withings.bodyMeasures.subscribe(measures => {
            this.bodyMeasures = measures
        })
        this.withings.sleepMeasures.subscribe(measure => {
            var today = this.strava.getToDate()
            var activityDate = measure.day
            if (activityDate !== undefined) {
                var diffDays = this.epr.getDateAbs(today) - this.epr.getDateAbs(activityDate);
                let bank = this.sleepMeasures[this.strava.duration - diffDays]
                if (bank !== undefined) {
                    this.sleepMeasures[this.strava.duration - diffDays].hrv = measure.hrv
                    this.sleepMeasures[this.strava.duration - diffDays].sleepScore = measure.sleepScore
                    this.sleepMeasures[this.strava.duration - diffDays].hr_average = measure.hr_average
                    var tempAct: any[] = []
                    for (let temp of this.sleepMeasures) tempAct.push(temp)
                    this.sleepMeasures = tempAct
                } else {
                    //console.log(today + ' ' + activityDate + ' ' + diffDays)
                }
            }
        })

    }

    ngAfterViewInit(): void {

        if (this.hrSort !== undefined && this.hrSort !== null) {
            this.hrSort.sortChange.subscribe((event) => {

            });

            if (this.dataSourceHR !== undefined) this.dataSourceHR.sort = this.hrSort;
        } else {

        }
        if (this.pwrSort !== undefined && this.pwrSort !== null) {
            this.pwrSort.sortChange.subscribe((event) => {

            });

            if (this.dataSourceKJ !== undefined) this.dataSourceKJ.sort = this.pwrSort;
        } else {

        }

    }

    calculate() {
        if (this.age !== undefined && this.age !== this.epr.person.age) {
            this.epr.setAge(this.age)
        }
        if (this.height !== undefined && this.height !== this.epr.person.height) {
            this.epr.setHeight(this.height)
        }
        if (this.zonePWR === undefined && this.epr.person.ftp !== undefined) {
            this.ftp =this.epr.person.ftp
            this.zonePWR = this.epr.getPWRZone()
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

        this.setGenders()
        this.calculateEnergy()
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
    calculateEnergy() {
        if (this.weight != undefined
            && this.height != undefined
            && this.administrativeGender !== undefined) {

            let energy= [{
                "name": "Base Metabolic Rate",
                "value": 0
            },
                {
                    "name": "Activity Adjustment",
                    "value": 0
                }];
            energy[0].value = (this.weight * 10) + (6.25 * this.height)
            if (this.administrativeGender.code == 'male') {
                energy[0].value = energy[0].value - (5 * this.age) + 5
            } else {
                energy[0].value = energy[0].value - (5 * this.age) - 16
            }
            if (this.exerciseFrequency !== undefined) {
                // @ts-ignore
                energy[1].value = energy[0].value * (+this.exerciseFrequency.code)
            }

            if (this.dailyEnergy !== undefined) {
                energy[1].value = energy[1].value - this.energy[0].value}
            else {
                energy[1].value = 0
            }
            if (this.energy[0].value !== energy[0].value ||
                this.energy[1].value !== energy[1].value) {
                // only refresh if necessary
                this.rmr = energy[0].value
                this.dailyEnergy = energy[1].value
                this.energy = energy
            }
        }
    }


    setSortPWR() {
        if (this.dataSourceKJ !== undefined) {
            // @ts-ignore
            this.dataSourceKJ.sort = this.pwrSort
            if (this.paginatorKJ !== undefined && this.dataSourceKJ !== undefined) this.dataSourceKJ.paginator = this.paginatorKJ

            this.dataSourceKJ.sortingDataAccessor = (item: any, property) => {
                switch (property) {
                    case 'date': {
                        try {
                            return item.start_date
                        } catch (e) {
                            console.log(item.start_date)
                            return new Date(item.start_date)
                        }
                        return 0;
                    }
                    case 'duration': {
                        return item.elapsed_time
                    }
                    case 'avghr': {
                        return item.average_heartrate
                    }
                    case 'avgpwr': {
                        return item.weighted_average_watts
                    }
                    case 'kcal': {
                        return item.kcal
                    }
                    case 'cadence': {
                        return item.average_cadence
                    }
                    default: {
                        return 0
                    }
                }
            };
        }
    }
    setSortHR() {

        // @ts-ignore
        this.dataSourceHR.sort = this.hrSort
        if (this.paginatorHR !== undefined) this.dataSourceHR.paginator = this.paginatorHR

        this.dataSourceHR.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'date': {
                    if (item.start_date !== undefined) {
                        try {
                        return item.start_date
                        }
                        catch (e) {
                            console.log(item.start_date)
                            return new Date(item.start_date)
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
    getWithings(){
        console.log('get Withings Triggered')
        // This forces an ordering of the results
        if (this.withings.getAccessToken() !== undefined) {

            let measures =[]
            for (var i = 0; i < this.strava.duration; i++) measures.push({day: this.date(i),
                measurementSetting: MeasurementSetting.home})
            this.sleepMeasures = measures
            this.withings.getSleep()
            this.withings.getMeasures()
        }
    }
    getStrava(){
        console.log('get Strava Triggered')
        // token changed so clear results
        let activityArray = []
        this.activities = []
        this.powerActivities = [];
        for(var i= 0; i <= this.strava.duration; i++) activityArray.push({ duration:0,kcal: 0, sessions: []})
        this.activityArray = activityArray
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
                    let lower = 3
                    let upper = 5
                    if (intense.code === 'moderate') {
                        lower = 5
                        upper = 7
                    } else if (intense.code === 'moderate-high') {
                        lower = 6
                        upper = 10
                    } else if (intense.code === 'very-high') {
                        lower = 8
                        upper = 12
                    }
                    this.exerciseEnergy = [
                        {
                            "name": "Daily Carbohydrate Intake (Lower)",
                            "value": this.perKgKCal(lower)
                        },
                        {
                            "name": "Daily Carbohydrate Intake (Upper)",
                            "value": this.perKgKCal(upper)
                        }
                    ];
                }
            }
            this.calculateEnergy()
        }
    }
    round(val : number | undefined) {
        if (val == undefined) return 0
        return Math.round(val)
    }

    perKgKCal(number: number): number  {
       let value = this.epr.perKgKCal(number)
        if (value === undefined) return 0
        return value
    }
    perKgMl(number: number): number | undefined {
        return this.epr.perKgMl(number)
    }


    pizza(kcal: number | undefined) {
      return this.epr.pizza(kcal)
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
        var now = this.strava.getToDate();
        var from = this.strava.getToDate();
        from.setDate(now.getDate() - this.strava.duration + number );
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        return days[ from.getDay() ];
    }

    getBackgroundHR(heartrate: number | undefined) {
        return this.epr.getBackgroundHR(heartrate)
    }
    getBackgroundPWRZone(zone: number) {
        return this.epr.getFTPColours()[zone-1]
    }
    getBackgroundPWRColor(watts: number) {
        return this.epr.getBackgroundPWR(watts)
    }

    getType(type: ActivityType | undefined) {
        return this.strava.getType(type)
    }

    getNames(activity: ActivityDay) {
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


    viewPA() {
        window.open("https://build.fhir.org/ig/HL7/physical-activity/measures.html", "_blank")
    }



    viewPower() {
        window.open("https://power-meter.cc/", "_blank")
    }

    addEvent(change: string, event: MatDatepickerInputEvent<Date>) {

        while (this.endDate.getDay() !=6) {
            this.endDate.setDate(this.endDate.getDate() +1);
        }
        this.strava.setToDate(this.endDate)
        this.getStrava()
        this.getWithings()
    }

    tabChanged(event: Event) {
        console.log(event)
        console.log(this.selectedTabIndex)
    }
    duration(time: number ) {
        return this.epr.duration(time)
    }

    onClick() {
        this.opened = !this.opened
    }
    onResize(event: any) {
        this.viewEnergyPie = [event.target.innerWidth / this.widthQuota, this.viewEnergyPie[1]];
    }

    stress(activity: SummaryActivity) {
        if (activity.weighted_average_watts !== undefined && this.ftp !== undefined) {
            let intensity = activity.weighted_average_watts / this.ftp
            let tss = 100 * (((activity.moving_time) * activity.weighted_average_watts * intensity) / (this.ftp * 3600))
            return Math.round(tss)
        } else {
            return 0
        }

    }
    stressTraining(activity: SummaryActivity) {
       return this.epr.stressTraining(activity)
    }

    intensity(activity: SummaryActivity) {
        if (activity.weighted_average_watts !== undefined && this.ftp !== undefined) {
            return Math.round(activity.weighted_average_watts * 100 / this.ftp)
        } else {
            return 0
        }

    }
    getBackgroundTrimp(trimp : number) :string {
        return this.epr.getTrimpColour(trimp)
    }
    getBackgroundTSS(activity: SummaryActivity) :string {
        let stress = this.stressTraining(activity)
        return this.epr.getTSSColour(stress)
    }

    intensityFactor(activity: SummaryActivity) {
        if (activity.np !== undefined && this.ftp !== undefined) {
            return Math.round(activity.np * 100 / this.ftp)
        } else {
            return 0
        }
    }
    date(number: number) {
        var now = this.strava.getToDate();
        var from = this.strava.getToDate();
        from.setDate(now.getDate() - this.strava.duration + number );
        return from;
    }
    /* PIE Chart data */


    refreshActivity() {
        console.log('Refresh Activity')
        this.activitiesWeek = []
        if (this.activityArray !== undefined) {
            var sortedActivity: ActivityDay[] = this.activityArray.sort((n1,n2) => {
                // @ts-ignore
                if (n1.day > n2.day) {
                    return 1;
                }

                // @ts-ignore
                if (n1.day < n2.day) {
                    return -1;
                }
                return 0;
            });

            for (let activityDay of sortedActivity) {
                for (let session of activityDay.sessions) {
                    if (session.activity !== undefined) {
                        let exercise = session.activity
                        if (activityDay.day !== undefined) {
                            let weekNo = this.getWeekNumber(activityDay.day)
                            var week: ActivityWeek | undefined = undefined;
                            for (let wk of this.activitiesWeek) {
                                if (wk.week === weekNo) week = wk
                            }
                            if (week == undefined) {
                                // @ts-ignore
                                week = {
                                    zones: [],
                                    duration: exercise.elapsed_time,
                                    kcal: 0,
                                    num_activities: 1,
                                    week: weekNo
                                }
                                if (exercise.kcal !== undefined) week.kcal = exercise.kcal
                                for(let f=0;f<5;f++) {
                                    let daySummary: DaySummary = {
                                        zone: (f+1),
                                        kcal: 0,
                                        duration: 0,
                                        num_activities:0
                                    }
                                    week.zones.push(daySummary)
                                }
                                this.activitiesWeek.push(week)
                            } else {
                                week.duration = week.duration + exercise.elapsed_time
                                if (exercise.kcal !== undefined) week.kcal = week.kcal + exercise.kcal
                                week.num_activities = (week.num_activities + 1)
                            }
                            let zone = this.getZone(exercise)
                            for (let day of week.zones) {
                                if (day.zone == zone) {

                                    // @ts-ignore
                                    if (exercise.kcal !== undefined) day.kcal = day.kcal + exercise.kcal

                                    day.duration = day.duration + exercise.elapsed_time
                                    // @ts-ignore
                                    day.num_activities = (+day.num_activities + 1)
                                }
                            }
                        } else {
                            //    console.log(exercise)
                        }
                    }
                }
            }
            this.stacked = undefined

            this.colorSingle.domain = []
            var stacked = []

            var domain = []

            this.refreshPowerActivity()
            this.refreshHRActivity()

            for (let wk of this.activitiesWeek) {
                // @ts-ignore
                let isoDate = this.getSundayFromWeekNum(wk.week)
                let iso= isoDate.toLocaleDateString()

                // @ts-ignore
                var entry = {"name": wk.week + ' ' + iso,
                    "series": [],
                    "pwr": [],
                    "hr": []
                }
                for (let f=0;f<5;f++) {
                    let ser = {
                        name: 'Heart rate Zone '+(f+1),
                        value: 0,
                        extra: {
                            wk: {}
                        }
                    }
                    // @ts-ignore
                    entry.series.push(ser)
                }
                for (let zone of wk.zones) {

                    if (zone.zone !== undefined) {
                        var ent = entry.series[zone.zone - 1]
                        if (zone.kcal !== undefined) {
                            // @ts-ignore
                            ent.value = ent.value + Math.round(zone.kcal)
                            // @ts-ignore
                            ent.extra.wk = zone

                        }
                    }
                }
                stacked.push(entry)

                let avg_dur = Math.round(wk.duration / (7 *60))
                if (avg_dur < 20) {  domain.push('lightgrey') }
                else if (avg_dur < 40 ) { domain.push('lightblue') }
                else if (avg_dur < 60 ) {  domain.push('lightgreen') }
                else if (avg_dur < 240 ) {   domain.push('lightsalmon') }
                else  {   domain.push('lightpink') }
            }

            for (let stack of stacked) {
                let week = +stack.name.split(' ')[0]
                let wkPower = this.getPWRWeek(week)
                stack.pwr = []
                wkPower.forEach((value, index) => {
                    // @ts-ignore
                    stack.pwr.push({
                        name: 'Power Zone '+ (index+1),
                        value: value.value
                    })
                });
                let wkHR = this.getHRWeek(week)
                stack.hr = []
                wkHR.forEach((value, index) => {
                    // @ts-ignore
                    stack.hr.push({
                        name: 'Heart rate Zone '+ (index+1),
                        value: value.value
                    })
                });
            }

            this.stacked  = stacked.sort((n1,n2) => {
                if (n1.name < n2.name) {
                    return 1;
                }
                if (n1.name > n2.name) {
                    return -1;
                }
                return 0;
            });
            this.colorSingle.domain = domain
        }
    }
    getWeekNumber(d : Date) {
        return this.epr.getWeekNumber(d);
    }
    getSundayFromWeekNum(weekNum : number) {
        var sunday = new Date(this.strava.getToDate().getFullYear(), 0, (1 + (weekNum - 1) * 7));
        while (sunday.getDay() !== 0) {
            sunday.setDate(sunday.getDate() + 1);
        }
        return sunday;
    }
    getZone(activity: SummaryActivity) {
        let zone = this.epr.getHRZone()
        if (zone == undefined) return 0;
        if (activity == undefined) return 1;

        if (activity.average_heartrate == undefined) return 1
        // @ts-ignore
        if (activity.average_heartrate < zone.z1?.min) return 1
        // @ts-ignore
        if (activity.average_heartrate < zone.z2?.min) return 1
        // @ts-ignore
        if (activity.average_heartrate < zone.z3?.min) return 2
        // @ts-ignore
        if (activity.average_heartrate < zone.z4?.min) {
            return 3
        }
        // @ts-ignore
        if (activity.average_heartrate < zone.z5?.min) {
            return 4
        }
        return 5
    }
    getPWRWeek(weekNo : number) {

        let single: any[] = []
        if (this.multiPWR !== undefined) {
            for (let bar of this.multiPWR) {
                var singleBar: any = {
                    name: bar.name,
                    value: 0
                }
                for (let wk of bar.series) {
                    if (this.yScaleMax<wk.value) this.yScaleMax = wk.value
                    if (wk.name === weekNo ) {
                        if (wk.value !== undefined) {
                            singleBar.value = wk.value
                        }
                    }
                }
                single.push(singleBar)
            }
        }
        return single
    }
    getHRWeek(weekNo : number) {

        let single: any[] = []
        if (this.multiHR !== undefined) {
            for (let bar of this.multiHR) {
                var singleBar: any = {
                    name: bar.name,
                    value: 0
                }
                for (let wk of bar.series) {
                    if (this.yScaleMax<wk.value) this.yScaleMax = wk.value
                    if (wk.name === weekNo ) {
                        if (wk.value !== undefined) {
                            singleBar.value = wk.value
                        }
                    }
                }
                single.push(singleBar)
            }
        }
        return single
    }
    private refreshPowerActivity() {
        this.multiPWR = undefined

        this.yScaleMax = 0
        var multi = []
        var zones = this.epr.getPWRZone()
        multi.push({name : zones?.z1.min , series: []})
        multi.push({name : zones?.z2.min , series: []})
        multi.push({name : zones?.z3.min , series: []})
        multi.push({name : zones?.z4.min , series: []})
        multi.push({name : zones?.z5.min , series: []})
        multi.push({name : zones?.z6.min , series: []})
        multi.push({name : zones?.z7.min , series: []})

        if (this.activityArray !== undefined) {

            for (let act of this.activityArray) {
                if (act.sessions !== undefined && act.day !== undefined) {
                    for(let session of act.sessions) {
                        if (session.activity !== undefined) {
                            if (session.activity.zones !== undefined) {
                                for (let zone of session.activity.zones) {
                                    if (zone.type === 'power') {
                                        for (let bucket of zone.distribution_buckets) {
                                            for (let mul of multi) {
                                                if (bucket.min == mul.name) {
                                                    let weekNo = this.epr.getWeekNumber(act.day)

                                                    var fd: any = undefined
                                                    for (let series of mul.series) {
                                                        // @ts-ignore
                                                        if (series.name === weekNo) {
                                                            fd = series
                                                        }
                                                    }
                                                    if (fd === undefined) {
                                                        fd = {
                                                            name: weekNo,
                                                            value: Math.round(bucket.time / 60)
                                                        }
                                                        // @ts-ignore
                                                        mul.series.push(fd)
                                                    } else {
                                                        fd.value = fd.value + Math.round(bucket.time / 60)
                                                    }

                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

            }
        }
        this.multiPWR = multi
    }

    private refreshHRActivity() {
        this.multiHR = undefined

        this.yScaleMax = 0
        var multi = []
        var zones = this.epr.getHRZone()
        if (zones!== undefined) {

            // @ts-ignore
            multi.push({name : zones.z1.min , series: []})
            // @ts-ignore
            multi.push({name : zones.z2.min , series: []})
            // @ts-ignore
            multi.push({name : zones.z3.min , series: []})
            // @ts-ignore
            multi.push({name : zones.z4.min , series: []})
            // @ts-ignore
            multi.push({name : zones.z5.min , series: []})


            if (this.activityArray !== undefined) {

                for (let act of this.activityArray) {
                    if (act.sessions !== undefined && act.day !== undefined) {
                        for (let session of act.sessions) {
                            if (session.activity !== undefined) {
                                if (session.activity.zones !== undefined) {
                                    for (let zone of session.activity.zones) {
                                        if (zone.type === 'heartrate') {
                                            for (let bucket of zone.distribution_buckets) {
                                                for (let mul of multi) {
                                                    if (bucket.min == mul.name) {
                                                        let weekNo = this.epr.getWeekNumber(act.day)

                                                        var fd: any = undefined
                                                        for (let series of mul.series) {
                                                            // @ts-ignore
                                                            if (series.name === weekNo) {
                                                                fd = series
                                                            }
                                                        }
                                                        if (fd === undefined) {
                                                            fd = {
                                                                name: weekNo,
                                                                value: Math.round(bucket.time / 60)
                                                            }
                                                            // @ts-ignore
                                                            mul.series.push(fd)
                                                        } else {
                                                            fd.value = fd.value + Math.round(bucket.time / 60)
                                                        }

                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                }
            }
        }
        this.multiHR = multi
    }

    labelFormatting(c : any) {

        return `${(c.label)} (grams)`;
    }

    protected readonly curveCatmullRom = curveCatmullRom;

    totalPie(pie: any) : number {
        let total = 0
        if (pie.length !== undefined) {
            for (let entry of pie) {
                total += entry.value
            }
        }
        return total
    }

    getDays(series: string) {
        let week = +series.split(' ')[0]
        let thisWeek = this.getWeekNumber(new Date())
        if (thisWeek === week) {
            let dayOfWeek = (new Date()).getDay()
            return dayOfWeek + 1
        }
        let startWeek = this.getWeekNumber(this.strava.getFromDate())
        if (startWeek === week) {
            let days = 7-this.strava.getFromDate().getDay()
            return days
        }
        return 7;
    }
}
