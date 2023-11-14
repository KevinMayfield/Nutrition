import {AfterViewInit, Component, Input} from '@angular/core';


@Component({
  selector: 'app-pie-chart-plus',
  templateUrl: './pie-chart-plus.component.html',
  styleUrls: ['./pie-chart-plus.component.scss']
})
export class PieChartPlusComponent implements AfterViewInit {
  @Input()
  view: any;
  @Input()
  scheme: any;
  @Input()
  label: any;
  @Input()
  results: any;
  @Input()
  widthQuota: number = 1;
  @Input()
  unit: any;
    @Input()
    columns: number = 2 ;



  onResize(event: any) {
    this.view = [event.target.innerWidth / this.widthQuota, this.view[1]];
  }

  labelFormatting(c : any) {

    return `${(c.label)} (grams)`;
  }
  ngAfterViewInit(): void {
    //this.view = [event.target.innerWidth / this.widthQuota, this.view[1]];
  }

  total(results: any) {
      var sum=0
      if (results !== undefined) {
        results.forEach((answer :any) => {
          sum += answer.value
        })
      }
      return Math.round(sum)
  }

  round(value: number) {
      return Math.round(value )
  }

  average(value : number) {
     const total = this.total(this.results)
     if (total > 0) {
        return Math.round(value * 100 / total)
     }
     return 0
  }

    getWidth(offsetWidth: number) {
        if (this.results != undefined && this.results.length > 1) {
            return offsetWidth / (this.results.length + 1)
        }
        return offsetWidth / 2
    }
}
