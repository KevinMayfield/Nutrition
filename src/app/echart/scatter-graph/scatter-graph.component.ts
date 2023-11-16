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
  yMin: number | undefined

  @Input()
  yMax: number | undefined


  // @ts-ignore
  @ViewChild('myDiv', {static: false}) myDiv: ElementRef;

  myChart : EChartsType | undefined
  ngAfterViewInit() {

    var chartDom = this.myDiv.nativeElement;

    this.myChart = echarts.init(chartDom);
    this.setOptions()


  }
  setOptions(){
    var option: EChartsOption = {
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
        min: this.yMin,
        max: this.yMax
      },
      series: this.data
    }
    if (this.myChart !== undefined) this.myChart.setOption(option);
  }

  ngOnInit(): void {
  }
}
