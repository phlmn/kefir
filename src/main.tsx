import React, { SyntheticEvent, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  SVGCoordinateType,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
  Selection,
} from 'victory';
import { biquadPeak } from '@thi.ng/dsp/biquad';
import { filterResponse } from '@thi.ng/dsp/filter-response';

import {
  calculateTaps,
  frequencyResponse,
  getPyodide,
  ifft,
  minimumPhase,
} from './fir';

getPyodide();

const peakFilter = ({
  frequency,
  gain,
  q,
}: {
  frequency: number;
  gain: number;
  q: number;
}) => {
  const coeffs = biquadPeak(frequency / 48000, q, gain).filterCoeffs();
  return (f: number) => filterResponse(coeffs, f / 48000).mag;
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

function samplingFrequencies(): number[] {
  const frequencies = [];
  let i = 10;
  while (i < 24000) {
    frequencies.push(i);
    i += i / 40;
  }
  return frequencies;
}

function freqencyResponse(
  filters: Array<(f: number) => number>,
  frequencies: number[],
) {
  return frequencies.map((freq) =>
    filters.reduce((acc, fn) => acc + fn(freq), 0),
  );
}

function zipToXY(x: number[], y: number[]): { x: number; y: number }[] {
  return x.map((x, i) => ({ x, y: y[i] }));
}

function App() {
  const [filterDefs, setFilterDefs] = useState([
    { type: 'peak', frequency: 10000, gain: -1, q: 1 },
    { type: 'peak', frequency: 100, gain: -1, q: 2 },
    { type: 'peak', frequency: 200, gain: -1, q: 0.5 },
    { type: 'peak', frequency: 1000, gain: -1, q: 10 },
  ]);
  const filters = filterDefs.map(filterFromDef);
  const frequencies = samplingFrequencies();
  const masterGains = freqencyResponse(filters, frequencies);
  const masterData = zipToXY(frequencies, masterGains);

  const [selectedPoint, setSelectedPoint] = useState<number | undefined>();
  const [dragging, setDragging] = useState(false);

  const [taps, setTaps] = useState<number[] | undefined>();
  const [filterFrequencyResponse, setFilterFrequencyResponse] = useState<
    Array<{ x: number; y: number }> | undefined
  >();
  const [filterPhaseResponse, setFilterPhaseResponse] = useState<
    Array<{ x: number; y: number }> | undefined
  >();

  let selectedData;
  if (selectedPoint !== undefined) {
    selectedData = zipToXY(
      frequencies,
      freqencyResponse([filters[selectedPoint]], frequencies),
    );
  }

  const taps_total = taps?.map((x) => x * x)?.reduce((x, acc) => x + acc);
  const latency_estimation = taps
    ?.map((x, i) => ((x * x) / (taps_total || 0)) * i * (1000 / 48000))
    .reduce((x, acc) => x + acc);

  const dbToAxis = (x: Array<{ x: number; y: number }>) =>
    x.map((x) => ({ ...x, y: x.y / 20 }));
  const degToAxis = (x: Array<{ x: number; y: number }>) =>
    x.map((x) => ({ ...x, y: x.y / 180 }));

  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div>
      <div
        style={{
          outline: 'none',
        }}
        ref={containerRef}
        onKeyDown={(e) => {
          if (selectedPoint === undefined) return;
          if (e.key === 'Delete' || e.key === 'Backspace') {
            const newFilterDefs = filterDefs.filter(
              (_, i) => i !== selectedPoint,
            );

            let newPoint = Math.max(0, selectedPoint - 1);
            if (newFilterDefs.length > 0) {
              setSelectedPoint(newPoint);
            } else {
              setSelectedPoint(undefined);
            }

            setFilterDefs(newFilterDefs);
          }
        }}
        tabIndex={0}
      >
        <VictoryChart
          style={{ parent: { maxWidth: '1200px' } }}
          theme={VictoryTheme.material}
          scale={{ x: 'log', y: 'linear' }}
          width={1200}
          events={[
            {
              target: 'parent',
              eventHandlers: {
                onMouseMove: (evt, targetProps) => {
                  const parentSVG =
                    targetProps.parentSVG || Selection.getParentSVG(evt);
                  const cursorSVGPosition = Selection.getSVGEventCoordinates(
                    evt,
                    parentSVG,
                  );
                  let cursorValue: SVGCoordinateType | null =
                    Selection.getDataCoordinates(
                      targetProps,
                      targetProps.scale,
                      cursorSVGPosition.x,
                      cursorSVGPosition.y,
                    );

                  if (dragging && selectedPoint != undefined) {
                    const newFilterDefs = [...filterDefs];
                    newFilterDefs[selectedPoint] = {
                      ...filterDefs[selectedPoint],
                      frequency: cursorValue.x,
                      gain: Math.max(-20, Math.min(cursorValue.y * 20, 20)),
                    };
                    setFilterDefs(newFilterDefs);
                  }
                },
                onClick: (event: SyntheticEvent, targetProps) => {
                  const e = event as React.MouseEvent;
                  if (e.detail != 2) return;
                  const parentSVG =
                    targetProps.parentSVG || Selection.getParentSVG(e);
                  const cursorSVGPosition = Selection.getSVGEventCoordinates(
                    e,
                    parentSVG,
                  );
                  let cursorValue: SVGCoordinateType | null =
                    Selection.getDataCoordinates(
                      targetProps,
                      targetProps.scale,
                      cursorSVGPosition.x,
                      cursorSVGPosition.y,
                    );

                  const newFilterDefs = [...filterDefs];
                  newFilterDefs.push({
                    type: 'peak',
                    frequency: cursorValue.x,
                    gain: Math.max(-20, Math.min(cursorValue.y * 20, 20)),
                    q: 3,
                  });
                  setFilterDefs(newFilterDefs);
                  setSelectedPoint(newFilterDefs.length - 1);
                },
                onMouseUp: () => {
                  return [
                    {
                      target: 'data',
                      mutation: () => {
                        setDragging(false);
                        containerRef.current?.focus();
                      },
                    },
                  ];
                },
              },
            },
          ]}
          domain={{ x: [20, 20000], y: [-1, 1] }}
        >
          <VictoryAxis
            label="Gain (db)"
            style={{
              axisLabel: { fontSize: 12, padding: 25 },
              tickLabels: { fontSize: 12, padding: 5 },
              ticks: { stroke: 0 },
              axis: { stroke: 0 },
            }}
            dependentAxis
            tickValues={[-1, -0.5, 0, 0.5, 1]}
            tickFormat={[-20, -10, 0, 10, 20]}
          />
          <VictoryAxis
            label="Phase (deg)"
            orientation={'right'}
            style={{
              axisLabel: { fontSize: 12, padding: 25 },
              tickLabels: { fontSize: 12, padding: 5 },
              ticks: { stroke: 0 },
              axis: { stroke: 0 },
            }}
            dependentAxis
            tickValues={[-1, -0.5, 0, 0.5, 1]}
            tickFormat={[-180, -90, 0, 90, 180]}
          />
          <VictoryAxis
            style={{
              tickLabels: { fontSize: 12, padding: 10 },
              ticks: { size: 0, strokeWidth: 2, strokeLinecap: 'square' },
            }}
            crossAxis
          />
          <VictoryLine
            style={{ data: { strokeWidth: 2, stroke: '#c43a31' } }}
            data={dbToAxis(masterData)}
            interpolation="catmullRom"
          />
          {filterFrequencyResponse && (
            <VictoryLine
              style={{
                data: {
                  strokeWidth: 2,
                  stroke: '#aaaaaa',
                  strokeDasharray: '2,2',
                },
              }}
              data={dbToAxis(filterFrequencyResponse)}
              interpolation="catmullRom"
            />
          )}
          {filterPhaseResponse && (
            <VictoryLine
              style={{
                data: {
                  strokeWidth: 2,
                  stroke: '#59f',
                  strokeDasharray: '2,2',
                },
              }}
              data={degToAxis(filterPhaseResponse)}
              interpolation="catmullRom"
            />
          )}
          {selectedData && (
            <VictoryArea
              style={{ data: { fill: '#c43a31', opacity: 0.25 } }}
              data={dbToAxis(selectedData)}
              interpolation="catmullRom"
            />
          )}
          <VictoryScatter
            data={dbToAxis(
              filterDefs.map((def) => ({
                x: def.frequency,
                y: def.gain,
              })),
            )}
            size={(d) => (d.index === selectedPoint ? 6 : 5)}
            style={{
              data: {
                strokeWidth: 3,
                strokeOpacity: 1.0,
                stroke: 'white',
                cursor: 'pointer',
                fill: (d) => (d.index === selectedPoint ? '#c43a31' : '#555'),
              },
            }}
            events={[
              {
                target: 'data',
                eventHandlers: {
                  onWheel: (event, targetProps) => {
                    const e = event as React.WheelEvent;
                    return [
                      {
                        target: 'data',
                        mutation: (props) => {
                          const newFilterDefs = [...filterDefs];
                          newFilterDefs[props.index] = {
                            ...filterDefs[props.index],
                            q: Math.max(
                              0.1,
                              Math.min(
                                24,
                                filterDefs[props.index].q +
                                  (e.deltaY * filterDefs[props.index].q) / 100,
                              ),
                            ),
                          };
                          setFilterDefs(newFilterDefs);
                          setSelectedPoint(props.index);
                        },
                      },
                    ];
                  },
                  onMouseDown: () => {
                    return [
                      {
                        target: 'data',
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
            domain={{ x: [20, 20000], y: [-1, 1] }}
          />
          <VictoryAxis
            label="Gain (db)"
            style={{
              axisLabel: { fontSize: 12, padding: 25 },
              tickLabels: { fontSize: 12, padding: 5 },
              ticks: { stroke: 0 },
              axis: { stroke: 0 },
            }}
            dependentAxis
            tickValues={[-1, -0.5, 0, 0.5, 1]}
            tickFormat={[-20, -10, 0, 10, 20]}
          />
          <VictoryAxis
            label="Phase (deg)"
            orientation={'right'}
            style={{
              axisLabel: { fontSize: 12, padding: 25 },
              tickLabels: { fontSize: 12, padding: 5 },
              ticks: { stroke: 0 },
              axis: { stroke: 0 },
            }}
            dependentAxis
            tickValues={[-1, -0.5, 0, 0.5, 1]}
            tickFormat={[-180, -90, 0, 90, 180]}
          />
          <VictoryAxis
            style={{
              tickLabels: { fontSize: 12, padding: 10 },
              ticks: { size: 0, strokeWidth: 2, strokeLinecap: 'square' },
            }}
            crossAxis
          />
          <VictoryLine
            style={{ data: { strokeWidth: 2, stroke: '#c43a31' } }}
            data={dbToAxis(masterData)}
            interpolation="catmullRom"
          />
          {filterFrequencyResponse && (
            <VictoryLine
              style={{
                data: {
                  strokeWidth: 2,
                  stroke: '#fa8690',
                  strokeDasharray: '2,2',
                },
              }}
              data={dbToAxis(filterFrequencyResponse)}
              interpolation="catmullRom"
            />
          )}
          {filterPhaseResponse && (
            <VictoryLine
              style={{
                data: {
                  strokeWidth: 2,
                  stroke: '#59f',
                  strokeDasharray: '2,2',
                },
              }}
              data={degToAxis(filterPhaseResponse)}
              interpolation="catmullRom"
            />
          )}
          {selectedData && (
            <VictoryArea
              style={{ data: { fill: '#c43a31', opacity: 0.25 } }}
              data={dbToAxis(selectedData)}
              interpolation="catmullRom"
            />
          )}
          <VictoryScatter
            data={dbToAxis(
              filterDefs.map((def) => ({
                x: def.frequency,
                y: def.gain,
              })),
            )}
            size={(d) => (d.index === selectedPoint ? 6 : 5)}
            style={{
              data: {
                strokeWidth: 3,
                strokeOpacity: 1.0,
                stroke: 'white',
                cursor: 'pointer',
                fill: (d) => (d.index === selectedPoint ? '#c43a31' : '#555'),
              },
            }}
            events={[
              {
                target: 'data',
                eventHandlers: {
                  onWheel: (event, targetProps) => {
                    const e = event as React.WheelEvent;
                    return [
                      {
                        target: 'data',
                        mutation: (props) => {
                          const newFilterDefs = [...filterDefs];
                          newFilterDefs[props.index] = {
                            ...filterDefs[props.index],
                            q: Math.max(
                              0.1,
                              Math.min(
                                24,
                                filterDefs[props.index].q +
                                  (e.deltaY * filterDefs[props.index].q) / 100,
                              ),
                            ),
                          };
                          setFilterDefs(newFilterDefs);
                          setSelectedPoint(props.index);
                        },
                      },
                    ];
                  },
                  onMouseDown: () => {
                    return [
                      {
                        target: 'data',
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
      </div>

      <button
        onClick={async () => {
          let taps = await calculateTaps(
            4800,
            [0, ...masterData.map((d) => d.x), 24000],
            [
              dbToAmplitude(masterData[0].y),
              ...masterData.map((d) => dbToAmplitude(d.y)),
              0,
            ],
          );
          setTaps(taps);

          const [w, gains, phase] = await frequencyResponse(taps, frequencies);
          const f = new Array(...w).map((freq, i) => {
            return { x: freq, y: amplitudeToDb(gains[i]) };
          });
          const p = new Array(...w).map((freq, i) => {
            return { x: freq, y: phase[i] };
          });

          setFilterFrequencyResponse(f);
          setFilterPhaseResponse(p);
        }}
      >
        Calculate Linear Phase!
      </button>
      <button
        onClick={async () => {
          let taps = await calculateTaps(
            4800,
            [0, ...masterData.map((d) => d.x), 24000],
            [
              dbToAmplitude(masterData[0].y),
              ...masterData.map((d) => dbToAmplitude(d.y) * dbToAmplitude(d.y)),
              0,
            ],
          );
          taps = await minimumPhase(taps);
          setTaps(taps);

          const [w, gains, phase] = await frequencyResponse(taps, frequencies);
          const f = new Array(...w).map((freq, i) => {
            return { x: freq, y: amplitudeToDb(gains[i]) };
          });
          const p = new Array(...w).map((freq, i) => {
            return { x: freq, y: phase[i] };
          });

          setFilterFrequencyResponse(f);
          setFilterPhaseResponse(p);
        }}
      >
        Calculate Minimum Phase!
      </button>
      <button
        onClick={async () => {
          const N = 4800;
          const freqs = Array(N / 2)
            .fill(0)
            .map((_, i) => (i / N) * 24_000);
          const gainInput = [
            ...freqencyResponse(filters, freqs),
            ...freqencyResponse(filters, freqs).reverse(),
          ];
          const phaseInput = Array(N).fill(0);
          const [real, imag] = await ifft(gainInput, phaseInput);
          console.log(
            'real sum',
            real.map((x) => Math.abs(x)).reduce((x, a) => a + x),
          );
          console.log(
            'imag sum',
            imag.map((x) => Math.abs(x)).reduce((x, a) => a + x),
          );

          const taps = real.slice(0, N / 2);
          setTaps(taps);
          const [w, gains, phase] = await frequencyResponse(taps, frequencies);
          const f = new Array(...w).map((freq, i) => {
            return { x: freq, y: amplitudeToDb(gains[i]) };
          });
          const p = new Array(...w).map((freq, i) => {
            return { x: freq, y: phase[i] };
          });

          setFilterFrequencyResponse(f);
          setFilterPhaseResponse(p);
        }}
      >
        Calculate Linear Phase DIY!
      </button>

      {taps && (
        <div>
          <div>Estimated Latency: {latency_estimation?.toFixed(2)}ms</div>
          <textarea value={taps.join('\n')}></textarea>
          <VictoryChart
            theme={VictoryTheme.material}
            style={{ parent: { maxWidth: '1200px' } }}
            width={1200}
            height={500}
          >
            <VictoryLine
              style={{
                data: { stroke: '#c43a31', strokeWidth: 1 },
              }}
              data={[...taps].map((y, i) => ({ x: i / 48, y }))}
            />
          </VictoryChart>
        </div>
      )}
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
  document.getElementById('root') as HTMLElement,
);
root.render(<App />);
