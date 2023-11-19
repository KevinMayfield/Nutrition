import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {EChartsOption} from "echarts";

@Component({
  selector: 'app-stacked-chart',
  templateUrl: './stacked-chart.component.html',
  styleUrls: ['./stacked-chart.component.scss']
})
export class StackedChartComponent implements AfterViewInit, OnInit {

  @Input()
  set setData(data: any[]) {
    this.data = data
    this.setOptions()
  }

  data: any[]
      // @ts-ignore
      | undefined

  @Input() colours: string[] = ['#7aa3e5', '#5AA454', '#CFC0BB', '#E44D25', '#a8385d', '#aae3f5']


  @Input()
  set xAxis(xAxis: any[]) {

    this.xAxisData = xAxis
    this.setOptions()
  }

  xAxisData: any | undefined


  // @ts-ignore
  option: EChartsOption


  @Input()
  height = "300px"


  ngAfterViewInit() {
    this.doChartSetup()
  }
  doChartSetup() {

  }
  setOptions() {

    this.option == undefined
    if (this.xAxisData !== undefined && this.data !== undefined) {
      let option :any = {
        color: this.colours,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        yAxis: [
          {
            type: 'value'
          }
        ],
        xAxis: this.xAxisData,
        series: this.data,
        legend: {
          data: [],
          left: 'center',
          bottom: 10
        }
      }


      if (this.data !== undefined) {
        this.data.forEach(data => {
          // @ts-ignore
          option.legend.data.push(data.name)
        })
      }
      this.option = option
    }
  }

  ngOnInit(): void {
    this.doChartSetup()
  }
}
