import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import * as echarts from "echarts";
import {EChartsOption, EChartsType} from "echarts";
import {ActivityDay} from "../../models/activity-day";

@Component({
  selector: 'app-line-graph',
  templateUrl: './line-graph.component.html',
  styleUrls: ['./line-graph.component.scss']
})
export class LineGraphComponent implements AfterViewInit, OnInit {

  @Input()
  set setData(data: any[]) {
    this.data = data
    this.setOptions()
  }
  data: any[]
      // @ts-ignore
      | undefined

  @Input()
  xData: any[]
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
    var myChart = echarts.init(chartDom);
   this.setOptions()

  }

  setOptions(){
    var option: EChartsOption = {
      xAxis: {
        type: 'time',
        data: this.xData
      },
      yAxis: {
        min: this.yMin,
        max: this.yMax
      },
      series: [
        {
          data: this.data,
          type: 'line'
        }
      ]
    }
    if (this.myChart !== undefined) this.myChart.setOption(option);
  }

  ngOnInit(): void {
  }
}
