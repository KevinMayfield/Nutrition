import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import * as echarts from "echarts";
import {EChartsOption, EChartsType} from "echarts";

@Component({
  selector: 'app-scatter-graph',
  templateUrl: './scatter-graph.component.html',
  styleUrls: ['./scatter-graph.component.scss']
})
export class ScatterGraphComponent implements AfterViewInit, OnInit {

  @Input()
  set setData(data: any[]) {
    this.data = data
    this.setOptions()
  }
  data: any[]
      // @ts-ignore
      | undefined


  @Input()
  set yMin(yMin: number){
    this.min = yMin
    this.setOptions()
  }

  @Input()
  set yMax(yMax: number){
    this.max = yMax
  }
  min: number | undefined
  max: number | undefined

  // @ts-ignore
  option: EChartsOption

  // @ts-ignore
  @ViewChild('myDiv', {static: false}) myDiv: ElementRef;

  myChart : EChartsType | undefined

  @Input()
  height = "300px"

  ngAfterViewInit() {
    this.doChartSetup()
  }

  doChartSetup() {
    if (this.myDiv !== undefined) {
      var chartDom = this.myDiv.nativeElement;
      if (chartDom !== undefined) {
        this.myChart = echarts.init(chartDom);
        this.myChart.setOption(this.option);
      }
    }
  }
  setOptions() {

      this.option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        xAxis: {
          type: 'time'
        },
        yAxis: {
          min: this.min,
          max: this.max
        },
        series: this.data
      }

  }

  ngOnInit(): void {
    this.doChartSetup()
  }
}
