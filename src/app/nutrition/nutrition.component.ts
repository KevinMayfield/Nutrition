import { Component } from '@angular/core';
import {EPRService} from "../service/epr.service";

@Component({
  selector: 'app-nutrition',
  templateUrl: './nutrition.component.html',
  styleUrls: ['./nutrition.component.scss']
})
export class NutritionComponent {

    fluidAdvice =  'Weigh yourself before and after an one hour exercise in kilograms. The difference will indicate how much sweat you have lost during exercise. 1 kg =  1000 ml sweat loss, so if you have lost .75 kg you have lost 750 ml of fluid and so you need to drink 750 ml per hour.';

    constructor(
       private epr: EPRService
   ) {
   }

    pizza(kcal: number | undefined) {
        return this.epr.pizza(kcal)
    }
    perKgKCal(number: number): number | undefined {
        return this.epr.perKgKCal(number)
    }
    perKgMl(number: number): number | undefined {
        return this.epr.perKgMl(number)
    }


}
