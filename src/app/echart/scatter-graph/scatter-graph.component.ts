import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import * as echarts from "echarts";
import {EChartsOption} from "echarts";

@Component({
  selector: 'app-scatter-graph',
  templateUrl: './scatter-graph.component.html',
  styleUrls: ['./scatter-graph.component.scss']
})
export class ScatterGraphComponent implements AfterViewInit, OnInit {

  @Input()
  data: any[]
      // @ts-ignore
      | undefined
  // @ts-ignore
  @ViewChild('myDiv', {static: false}) myDiv: ElementRef;

  ngAfterViewInit() {

    var chartDom = this.myDiv.nativeElement;

    var myChart = echarts.init(chartDom);
    console.log(this.data?.length)
    console.log(this.data)
    var option: EChartsOption = {
      xAxis: {},
      yAxis: {},
      series: [
        {
          symbolSize: 20,
          data: this.data,
          type: 'scatter'
        }
      ]
    }
    myChart.setOption(option);

  }

  ngOnInit(): void {
  }
}
