import { Component } from '@angular/core';

@Component({
  selector: 'app-bmi',
  templateUrl: './bmi.component.html',
  styleUrls: ['./bmi.component.scss']
})
export class BMIComponent {
    bmi: string='';

    calculate() {
        this.bmi='Your BMI is 37.4 Your result suggests you are obese '
    }
}
