import {
  CategoryScale,
  Chart,
  ChartConfiguration,
  ChartDataset,
  Decimation,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  LogarithmicScale,
  PointElement,
  RadialLinearScale,
  ScatterController,
  SubTitle,
  TimeScale,
  TimeSeriesScale,
  Title,
} from "chart.js";
import React, { createRef, RefObject } from "react";
import { FilterDef, filterFromDef, sumFilters } from "./main";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Decimation,
  Filler,
  Legend,
  Title,
  SubTitle
);

type MyChartProps = {
  filterDefs: FilterDef[];
  onChangeFilterDefs: (defs: FilterDef[]) => void;
  selectedPoint: number | undefined;
  onSelectPoint: (point: number) => void;
};

export default class CurveEditor extends React.Component<MyChartProps> {
  onDrag: (x: number, y: number) => void = () => undefined;

  chart: Chart | undefined;
  dragging = false;
  canvasRef: RefObject<HTMLCanvasElement> = createRef();

  constructor(props: MyChartProps) {
    super(props);
  }

  componentDidMount() {
    if (this.canvasRef.current == null) return;

    const config: ChartConfiguration = {
      type: "line" as const,
      data: {
        datasets: [],
      },
      options: {
        events: [
          "mousemove",
          "mouseout",
          "click",
          "touchstart",
          "touchmove",
          "mousedown",
          "mouseup",
        ],
        animation: false,
        scales: {
          x: {
            type: "logarithmic",
            min: 10,
            max: 24000,
          },
          y: {
            min: -20,
            max: 20,
          },
        },
      },
      plugins: [
        {
          id: "myEventCatcher",
          beforeEvent: (chart, args, pluginOptions) => {
            if (args.event.type === "mousedown") {
              const element = chart.getActiveElements()[0];
              this.props.onSelectPoint(element?.index);
              this.dragging = true;
            }

            if (args.event.type === "mouseup") {
              this.dragging = false;
            }

            if (args.event.type === "mousemove") {
              if (this.dragging) {
                if (args.event.x !== null && args.event.y !== null) {
                  const x = chart.scales.x.getValueForPixel(args.event.x);
                  const y = chart.scales.y.getValueForPixel(args.event.y);
                  if (x !== undefined && y !== undefined) {
                    if (this.props.selectedPoint !== undefined) {
                      const newFilterDefs = [...this.props.filterDefs];
                      newFilterDefs[this.props.selectedPoint] = {
                        ...this.props.filterDefs[this.props.selectedPoint],
                        frequency: x,
                        gain: Math.max(-20, Math.min(y, 20)),
                      };
                      this.props.onChangeFilterDefs(newFilterDefs);
                    }
                  }
                }
              }
            }
          },
        },
      ],
    };

    this.chart = new Chart(this.canvasRef.current, config);
    this.updateChart();
  }

  updateChart() {    
    const filters = this.props.filterDefs.map(filterFromDef);

    const masterData = sumFilters(filters);

    let selectedData: Array<{x: number, y: number}> | undefined;
    if (this.props.selectedPoint !== undefined) {
      selectedData = sumFilters([filters[this.props.selectedPoint]]);
    }

    if (this.chart) {
      const datasets: ChartDataset[] = [
        {
          type: "line",
          pointRadius: 0,
          pointHoverRadius: 0,
          borderColor: "red",
          pointHitRadius: 0,
          data: masterData,
        },
        {
          type: "scatter",
          data: this.props.filterDefs.map((def) => ({
            x: def.frequency,
            y: def.gain,
          })),
          pointHitRadius: 5,
          borderColor: "red",
          pointRadius: 4,
          pointHoverRadius: 5,
        },
      ];

      if (selectedData) {
        datasets.push({
          type: "line",
          fill: "origin",
          backgroundColor: "red",
          pointRadius: 0,

          pointHoverRadius: 0,
          data: selectedData,
        });
      }

      this.chart.data = {
        datasets,
      };

      this.chart.update();
    }
  }

  shouldComponentUpdate() {
    this.updateChart();
    return false;
  }

  render() {
    return <canvas ref={this.canvasRef} />;
  }
}
