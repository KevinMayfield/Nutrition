import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {EChartsOption, EChartsType} from "echarts";
import * as echarts from "echarts";

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements AfterViewInit, OnInit {

  @Input()
  set setData(data: any[]) {
    this.data = data
    this.setOptions()
  }
  data: any[]
      // @ts-ignore
      | undefined

  @Input() colours : string[] = [ '#7aa3e5','#5AA454','#CFC0BB', '#E44D25',  '#a8385d', '#aae3f5']


  @Input()
  set yAxis(yAxis: any[]){

    this.yAxisData = yAxis
    this.setOptions()
  }
  yAxisData: any | undefined


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
    if (this.yAxisData !== undefined && this.data !== undefined) {
      let option :any = {
        color: this.colours,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        xAxis: {
          type: 'time'
        },
        series: this.data,
        legend: {
          data: [],
          left: 'center',
          bottom: 10
        }
      }

        option.yAxis = this.yAxisData


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
