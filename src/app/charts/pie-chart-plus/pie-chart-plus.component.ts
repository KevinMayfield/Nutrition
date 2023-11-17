import {AfterContentChecked, AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import * as echarts from "echarts";
import {EChartsType} from "echarts";


@Component({
  selector: 'app-pie-chart-plus',
  templateUrl: './pie-chart-plus.component.html',
  styleUrls: ['./pie-chart-plus.component.scss']
})
export class PieChartPlusComponent implements AfterViewInit, OnInit, AfterContentChecked {

    private isVisible: boolean = false;
  @Input()
  view: any;
  @Input()
  scheme: any;
  @Input()
  label: any;
  data : any;
  @Input()
  set results(data: any[]) {
      this.data = data;
      this.setOptions()
  }
  @Input()
  widthQuota: number = 1;
  @Input()
  unit: any;
    @Input()
    columns: number = 2 ;


    // @ts-ignore
    @ViewChild('PIEDiv', {static: false}) myDiv: ElementRef;
    myChart : EChartsType | undefined

    option: any

  labelFormatting(c : any) {

    return `${(c.label)} (grams)`;
  }
  ngAfterViewInit(): void {
        this.setChart()
  }
    ngOnInit(): void {
       this.setChart()
    }

    setChart(){
        if (this.myDiv !== undefined) {
            var chartDom = this.myDiv.nativeElement;
            if (chartDom !== undefined) {
                const myEl = chartDom;
                const observer = new ResizeObserver((entry) => {

                    if (entry !== undefined && entry.length>0) {
                        console.log(this.label + ' ' + entry[0].contentRect.height + ' ' + entry[0].contentRect.width + ' ' + (this.myDiv.nativeElement.offsetParent == null))
                    }
                });

                observer.observe(myEl);
                this.myChart = echarts.init(chartDom);
                this.myChart.setOption(this.option);
                this.myChart.resize({
                    width: 'auto',
                    height: 'auto',
                });
            }
        }
    }
    setOptions() {
        this.option = {
            tooltip: {
                trigger: 'item'
            },
            series: [
                {
                    name: this.label,
                    type: 'pie',
                    radius: ['70%', '90%'],
                    avoidLabelOverlap: true,
                    label: {
                        show: false,
                        position: 'center'
                    },
                    emphasis: {
                        label: {
                            show: false,
                            fontSize: 8,
                            fontWeight: 'bold'
                        }
                    },
                    labelLine: {
                        show: false
                    },
                    data: []
                }
            ]
        };
        this.data.forEach((value : any, index : number)=>{
            this.option.series[0].data.push({
                name: value.name,
                value: value.value,
                itemStyle : {
                    color: this.scheme.domain[index]
                }
            })
        })

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
     const total = this.total(this.data)
     if (total > 0) {
        return Math.round(value * 100 / total)
     }
     return 0
  }

    getWidth(offsetWidth: number) {
        if (this.data != undefined && this.data.length > 1) {
            return offsetWidth / (this.data.length + 1)
        }
        return offsetWidth / 2
    }
    ngAfterContentChecked(): void
    {
        if (this.myDiv !== undefined) {
            if (this.isVisible === false && this.myDiv.nativeElement.offsetParent != null) {
           //     console.log(this.label + ' isVisible switched from false to true');
                this.isVisible = true;

            } else if (this.isVisible === true && this.myDiv.nativeElement.offsetParent == null) {
                console.log(this.label + ' isVisible switched from true to false');
                this.isVisible = false;
            }
        } else {
       //     console.log(this.label + ' Not visible, no div');
            this.isVisible = false;
        }
    }
}
