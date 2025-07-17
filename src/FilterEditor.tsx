import React, { SyntheticEvent, useRef, useState } from 'react';
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
import produce from 'immer';

export function dbToAmplitude(db: number) {
  return Math.pow(10, db / 20);
}

export function amplitudeToDb(amp: number) {
  return Math.log10(amp) * 20;
}

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

const highpassFilter = ({
  frequency,
  gain,
  q,
}: {
  frequency: number;
  gain: number;
  q: number;
}) => {
  return (f: number) => {
    if (gain >= 0) {
      return 0.0;
    }

    let offset = frequency / f;
    let value = (Math.log2(offset) * -q) - 6;

    if (value < 0) {
      return Math.min(200, Math.max(-200, value));
    } else {
      return 0.0;
    }
  };
};

const lowpassFilter = ({
  frequency,
  gain,
  q,
}: {
  frequency: number;
  gain: number;
  q: number;
}) => {
  return (f: number) => {
    if (gain >= 0) {
      return 0.0;
    }

    let offset = f / frequency;
    let value = (Math.log2(offset) * -q) - 6;

    if (value < 0) {
      return Math.min(200, Math.max(-200, value));
    } else {
      return 0.0;
    }
  };
};

const filterMap = {
  peak: peakFilter,
  highpass: highpassFilter,
  lowpass: lowpassFilter,
} as const;

export function filterFromDef(def: any) {
  const { type, ...opts } = def;
  const createFilterFn = (filterMap as any)[type];

  if (createFilterFn) {
    return createFilterFn(opts);
  }
}

export function samplingFrequencies(): number[] {
  const frequencies = [];
  let i = 10;
  while (i < 24000) {
    frequencies.push(i);
    i += i / 40;
  }
  return frequencies;
}

export function freqencyResponse(
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

export type Filter = {
  type: keyof typeof filterMap;
  frequency: number;
  gain: number;
  q: number;
};

export function FilterEditor({
  filterDefs,
  setFilterDefs,
  computedGain,
  computedPhase,
}: {
  filterDefs: Filter[];
  setFilterDefs: (newFilterDefs: Filter[]) => void;
  computedGain?: Array<{ x: number; y: number }>;
  computedPhase?: Array<{ x: number; y: number }>;
}) {
  const filters = filterDefs.map(filterFromDef);
  const frequencies = samplingFrequencies();
  const masterGains = freqencyResponse(filters, frequencies);
  const masterData = zipToXY(frequencies, masterGains);

  const [selectedPoint, setSelectedPoint] = useState<number | undefined>();
  const [dragging, setDragging] = useState(false);

  let selectedData;
  if (selectedPoint !== undefined) {
    selectedData = zipToXY(
      frequencies,
      freqencyResponse([filters[selectedPoint]], frequencies),
    );
  }

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
          {computedGain && (
            <VictoryLine
              style={{
                data: {
                  strokeWidth: 2,
                  stroke: '#fa8690',
                  strokeDasharray: '2,2',
                },
              }}
              data={dbToAxis(computedGain)}
              interpolation="catmullRom"
            />
          )}
          {computedPhase && (
            <VictoryLine
              style={{
                data: {
                  strokeWidth: 2,
                  stroke: '#59f',
                  strokeDasharray: '2,2',
                },
              }}
              data={degToAxis(computedPhase)}
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
                fill: (d: any) => (d.index === selectedPoint ? '#c43a31' : '#555'),
              },
            }}
            events={[
              {
                target: 'data',
                eventHandlers: {
                  onWheel: (event: unknown, targetProps: unknown) => {
                    const e = event as React.WheelEvent;
                    e.nativeEvent.preventDefault();
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
        </VictoryChart>
      </div>

      <div className="container">
        <div className="row">
          <div className="column">
            <label>Type</label>
            <select
              disabled={selectedPoint == undefined}
              value={
                selectedPoint !== undefined
                  ? filterDefs[selectedPoint].type
                  : ''
              }
              onChange={(event) => {
                if (selectedPoint == undefined) {
                  return;
                }

                setFilterDefs(
                  produce(filterDefs, (draft) => {
                    draft[selectedPoint].type = event.currentTarget.value as Filter['type'];
                  }),
                );
              }}
            >
              {selectedPoint == undefined && <option value=""></option>}
              <option value="peak">Peak</option>
              <option value="highpass">Highpass</option>
              <option value="lowpass">Lowpass</option>
            </select>
          </div>
          <div className="column">
            <label>Frequency (Hz)</label>
            <input
              type="number"
              disabled={
                selectedPoint == undefined ||
                filterDefs[selectedPoint].frequency == undefined
              }
              value={
                (selectedPoint !== undefined &&
                  filterDefs[selectedPoint].frequency) ||
                ''
              }
              onChange={(event) => {
                if (selectedPoint == undefined) {
                  return;
                }

                setFilterDefs(
                  produce(filterDefs, (draft) => {
                    draft[selectedPoint].frequency = Number.parseFloat(
                      event.currentTarget.value,
                    );
                  }),
                );
              }}
            />
          </div>
          <div className="column">
            <label>Gain (db)</label>
            <input
              type="number"
              disabled={
                selectedPoint == undefined ||
                filterDefs[selectedPoint].gain == undefined
              }
              value={
                (selectedPoint !== undefined &&
                  filterDefs[selectedPoint].gain) ||
                ''
              }
              onChange={(event) => {
                if (selectedPoint == undefined) {
                  return;
                }

                setFilterDefs(
                  produce(filterDefs, (draft) => {
                    draft[selectedPoint].gain = Number.parseFloat(
                      event.currentTarget.value,
                    );
                  }),
                );
              }}
            />
          </div>
          <div className="column">
            <label>Q</label>
            <input
              type="number"
              disabled={
                selectedPoint == undefined ||
                filterDefs[selectedPoint].q == undefined
              }
              value={
                (selectedPoint !== undefined && filterDefs[selectedPoint].q) ||
                ''
              }
              onChange={(event) => {
                if (selectedPoint == undefined) {
                  return;
                }

                setFilterDefs(
                  produce(filterDefs, (draft) => {
                    draft[selectedPoint].q = Number.parseFloat(
                      event.currentTarget.value,
                    );
                  }),
                );
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FilterPreview({ taps }: { taps: number[] }) {
  return (
    <div>
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
  );
}
