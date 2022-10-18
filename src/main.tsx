import gaussian from "gaussian";
import { useState } from "react";
import ReactDOM from "react-dom/client";
import {
  SVGCoordinateType,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
  Selection,
} from "victory";

import { calculateTaps, frequencyResponse, getPyodide } from "./fir";

const normDist = gaussian(0, 1 / (2 * Math.PI));

getPyodide();

const peakFilter =
  ({ frequency, gain, q }: { frequency: number; gain: number; q: number }) =>
  (f: number) => {
    return normDist.pdf((f - frequency) / (frequency / q)) * gain;
  };

const filterMap = {
  peak: peakFilter,
};

function filterFromDef(def: any) {
  const { type, ...opts } = def;
  const createFilterFn = (filterMap as any)[type];

  if (createFilterFn) {
    return createFilterFn(opts);
  }
}

function freqencyResponse(filters: Array<(f: number) => number>) {
  const masterData: Array<{ x: number; y: number }> = [];

  let i = 10;
  while (i < 24000) {
    masterData.push({ x: i, y: filters.reduce((acc, f) => acc + f(i), 0) });
    i += i / 40;
  }

  console.log(`${masterData.length} points`);

  return masterData;
}

function App() {
  const [filterDefs, setFilterDefs] = useState([
    { type: "peak", frequency: 10000, gain: -1, q: 1 },
    { type: "peak", frequency: 100, gain: -1, q: 2 },
    { type: "peak", frequency: 200, gain: -1, q: 0.5 },
    { type: "peak", frequency: 1000, gain: -1, q: 10 },
  ]);
  const filters = filterDefs.map(filterFromDef);
  const masterData = freqencyResponse(filters);

  const [selectedPoint, setSelectedPoint] = useState<number | undefined>();
  const [dragging, setDragging] = useState(false);

  const [taps, setTaps] = useState<number[] | undefined>();
  const [filterFrequencyResponse, setFilterFrequencyResponse] = useState<
    Array<{ x: number; y: number }> | undefined
  >();

  let selectedData;
  if (selectedPoint !== undefined) {
    selectedData = freqencyResponse([filters[selectedPoint]]);
  }

  return (
    <div>
      <VictoryChart
        theme={VictoryTheme.material}
        scale={{ x: "log", y: "linear" }}
        domain={{ x: [10, 24000], y: [-12, 12] }}
        width={900}
        events={[
          {
            target: "parent",
            eventHandlers: {
              onMouseMove: (evt, targetProps) => {
                const parentSVG =
                  targetProps.parentSVG || Selection.getParentSVG(evt);
                const cursorSVGPosition = Selection.getSVGEventCoordinates(
                  evt,
                  parentSVG
                );
                let cursorValue: SVGCoordinateType | null =
                  Selection.getDataCoordinates(
                    targetProps,
                    targetProps.scale,
                    cursorSVGPosition.x,
                    cursorSVGPosition.y
                  );

                if (dragging && selectedPoint != undefined) {
                  const newFilterDefs = [...filterDefs];
                  newFilterDefs[selectedPoint] = {
                    ...filterDefs[selectedPoint],
                    frequency: cursorValue.x,
                    gain: cursorValue.y,
                  };
                  setFilterDefs(newFilterDefs);
                }
              },
              onMouseUp: () => {
                return [
                  {
                    target: "data",
                    mutation: () => {
                      setDragging(false);
                    },
                  },
                ];
              },
            },
          },
        ]}
      >
        <VictoryAxis style={{ ticks: { size: 0 } }} />
        {filterFrequencyResponse && (
          <VictoryLine
            style={{ data: { strokeWidth: 1.5, stroke: "#aaaaaa" } }}
            data={filterFrequencyResponse}
            interpolation="catmullRom"
          />
        )}
        <VictoryLine
          style={{ data: { strokeWidth: 1.5, stroke: "#c43a31" } }}
          data={masterData}
          interpolation="catmullRom"
        />
        {selectedData && (
          <VictoryArea
            style={{ data: { fill: "#c43a31", opacity: 0.25 } }}
            data={selectedData}
            interpolation="catmullRom"
          />
        )}
        <VictoryScatter
          data={filterDefs.map((def) => ({ x: def.frequency, y: def.gain }))}
          size={(d) => (d.index === selectedPoint ? 5 : 3.5)}
          style={{
            data: {
              opacity: 0.8,
              cursor: "pointer",
              fill: (d) => (d.index === selectedPoint ? "#c43a31" : "#555"),
            },
          }}
          events={[
            {
              target: "data",
              eventHandlers: {
                onMouseDown: () => {
                  return [
                    {
                      target: "data",
                      mutation: (props) => {
                        setSelectedPoint(props.index);
                        setDragging(true);
                      },
                    },
                  ];
                },
              },
            },
          ]}
        />
      </VictoryChart>

      <button
        onClick={async () => {
          const taps = await calculateTaps(
            4800 * 2,
            [0, ...masterData.map((d) => d.x), 24000],
            [0, ...masterData.map((d) => dbToAmplitude(d.y)), 0]
          );
          setTaps(taps);

          const [freqs, gains] = await frequencyResponse(taps);
          const f = new Array(...freqs).map((freq, i) => {
            return { x: freq, y: amplitudeToDb(gains[i]) };
          });

          console.log(f);

          setFilterFrequencyResponse(f);
        }}
      >
        Calculate!
      </button>

      <textarea value={taps?.join("\n")}></textarea>
    </div>
  );
}

function dbToAmplitude(db: number) {
  return Math.pow(10, db / 20);
}

function amplitudeToDb(amp: number) {
  return Math.log10(amp) * 20;
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);
