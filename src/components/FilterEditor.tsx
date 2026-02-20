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
  VictoryContainer,
} from 'victory';
import { biquadPeak } from '@thi.ng/dsp/biquad';
import { filterResponse } from '@thi.ng/dsp/filter-response';
import produce from 'immer';
import { FormField } from './FormField';
import { NumberInput } from './NumberInput';
import { DbGainInput } from './DbGainInput';
import { Field, FieldContent, FieldLabel } from './ui/field';
import { Switch } from './ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import useResizeObserver from 'use-resize-observer';

export function dbToAmplitude(db: number) {
  return Math.pow(10, db / 20);
}

export function amplitudeToDb(amp: number) {
  return Math.log10(amp) * 20;
}

function roundToDigits(value: number, digits: number) {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
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
    let value = Math.log2(offset) * -q - 6;

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
    let value = Math.log2(offset) * -q - 6;

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
  enabled: boolean;
};

export function FilterEditor({
  filterDefs,
  setFilterDefs,
  computedGain,
  computedPhase,
  selectedPoint,
  onSelectedPointChange,
}: {
  filterDefs: Filter[];
  setFilterDefs: (newFilterDefs: Filter[]) => void;
  computedGain?: Array<{ x: number; y: number }>;
  computedPhase?: Array<{ x: number; y: number }>;
  selectedPoint: number | null;
  onSelectedPointChange: (point: number | null) => void;
}) {
  const filters = filterDefs.filter((f) => f.enabled).map(filterFromDef);
  const frequencies = samplingFrequencies();
  const masterGains = freqencyResponse(filters, frequencies);
  const masterData = zipToXY(frequencies, masterGains);

  const [dragging, setDragging] = useState(false);

  let selectedData;
  if (selectedPoint != null) {
    const selectedFilter = filterFromDef(filterDefs[selectedPoint]);
    if (selectedFilter) {
      selectedData = zipToXY(
        frequencies,
        freqencyResponse([selectedFilter], frequencies),
      );
    }
  }

  const dbToAxis = (x: Array<{ x: number; y: number }>) =>
    x.map((x) => ({ ...x, y: x.y / 20 }));
  const degToAxis = (x: Array<{ x: number; y: number }>) =>
    x.map((x) => ({ ...x, y: x.y / 180 }));

  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useResizeObserver<HTMLDivElement>({
    ref: containerRef as React.RefObject<HTMLDivElement>,
  });

  return (
    <div>
      <div
        style={{
          outline: 'none',
          height: '320px',
        }}
        ref={containerRef}
        onKeyDown={(e) => {
          if (selectedPoint == null) return;
          if (e.key === 'Delete' || e.key === 'Backspace') {
            const newFilterDefs = filterDefs.filter(
              (_, i) => i !== selectedPoint,
            );

            let newPoint = Math.max(0, selectedPoint - 1);
            if (newFilterDefs.length > 0) {
              onSelectedPointChange(newPoint);
            } else {
              onSelectedPointChange(null);
            }

            setFilterDefs(newFilterDefs);
          }
        }}
        tabIndex={0}
      >
        <VictoryChart
          theme={{
            ...VictoryTheme.material,
            axis: {
              ...VictoryTheme.material.axis,
              style: {
                ...VictoryTheme.material.axis?.style,
                ticks: { stroke: 0 },
                axis: { stroke: 0 },
                tickLabels: {
                  fill: 'var(--foreground)',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  padding: 5
                },
                axisLabel: { fontSize: 12, padding: 25, fill: 'var(--foreground)', fontFamily: 'inherit' },
                grid: {
                  stroke: 'var(--color-neutral-600)',
                  strokeDasharray: '2, 2',
                },
              },
            },
          }}
          scale={{ x: 'log', y: 'linear' }}
          width={width}
          height={height}
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
                      frequency: roundToDigits(cursorValue.x, 0),
                      gain: roundToDigits(
                        Math.max(-20, Math.min(cursorValue.y * 20, 20)),
                        1,
                      ),
                    };
                    setFilterDefs(newFilterDefs);
                  }
                },
                onClick: (event: SyntheticEvent, targetProps) => {
                  const e = event as React.MouseEvent;
                  console.log(e);
                  if (e.detail == 1) { // left click
                    if (selectedPoint != undefined) {
                      onSelectedPointChange(null);
                    }
                  } else if (e.detail == 2) { // double click
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
                      frequency: roundToDigits(cursorValue.x, 0),
                      gain: roundToDigits(
                        Math.max(-20, Math.min(cursorValue.y * 20, 20)),
                        1,
                      ),
                      q: 3,
                      enabled: true,
                    });
                    setFilterDefs(newFilterDefs);
                      onSelectedPointChange(newFilterDefs.length - 1);
                  }
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
            tickValues={[
              20, 20, 50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000,
              20000,
            ]}
            tickFormat={(val) => (val >= 1000 ? `${val / 1000}k` : val)}
          />
          <VictoryLine
            style={{ data: { strokeWidth: 2, stroke: 'var(--color-red-500)' } }}
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
              style={{ data: { fill: '#c43a31', opacity: 0.3 } }}
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
                fill: (d: any) => {
                  return d.index === selectedPoint ? '#c43a31' : '#444';
                },
                fillOpacity: (d: any) =>
                  filterDefs[d.index]?.enabled ? 1.0 : 0.6,
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
                          onSelectedPointChange(props.index);
                        },
                      },
                    ];
                  },
                  onMouseDown: () => {
                    return [
                      {
                        target: 'data',
                        mutation: (props) => {
                          onSelectedPointChange(props.index);
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

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Field className="flex flex-col">
            <FieldLabel>Enabled</FieldLabel>
            <FieldContent>
              <Switch
                disabled={selectedPoint == null}
                checked={
                  selectedPoint != null
                    ? filterDefs[selectedPoint].enabled
                    : false
                }
                onCheckedChange={(checked) => {
                  if (selectedPoint == null) {
                    return;
                  }

                  setFilterDefs(
                    produce(filterDefs, (draft) => {
                      draft[selectedPoint].enabled = checked;
                    }),
                  );
                }}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Type</FieldLabel>
            <FieldContent>
              <Select
                // className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                disabled={selectedPoint == undefined}
                value={
                  selectedPoint != null
                    ? filterDefs[selectedPoint].type
                    : ''
                }
                onValueChange={(value) => {
                  if (selectedPoint == undefined) {
                    return;
                  }

                  setFilterDefs(
                    produce(filterDefs, (draft) => {
                      draft[selectedPoint].type = value as Filter['type'];
                    }),
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue>
                    {selectedPoint == undefined
                      ? ''
                      : filterDefs[selectedPoint].type}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/*{selectedPoint == undefined && <SelectItem value=""></SelectItem>}*/}
                  <SelectItem value="peak">Peak</SelectItem>
                  <SelectItem value="highpass">Highpass</SelectItem>
                  <SelectItem value="lowpass">Lowpass</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
          <FormField label="Frequency (Hz)" className="flex flex-col">
            <NumberInput
              disabled={
                selectedPoint == null ||
                filterDefs[selectedPoint].frequency == undefined
              }
              value={
                (selectedPoint != null &&
                  filterDefs[selectedPoint].frequency) ||
                0
              }
              onChange={(value) => {
                if (selectedPoint == undefined) {
                  return;
                }

                setFilterDefs(
                  produce(filterDefs, (draft) => {
                    draft[selectedPoint].frequency = value;
                  }),
                );
              }}
              parseAs="float"
              min={1}
              max={24000}
            />
          </FormField>
          <FormField label="Gain (db)" className="flex flex-col">
            <DbGainInput
              onChange={(value) => {
                if (selectedPoint == undefined) {
                  return;
                }

                setFilterDefs(
                  produce(filterDefs, (draft) => {
                    draft[selectedPoint].gain = value;
                  }),
                );
              }}
              value={
                (selectedPoint != null &&
                  filterDefs[selectedPoint].gain) ||
                0
              }
              disabled={
                selectedPoint == null ||
                filterDefs[selectedPoint].gain == undefined
              }
            />
          </FormField>
          <FormField label="Q" className="flex flex-col">
            <NumberInput
              disabled={
                selectedPoint == null ||
                filterDefs[selectedPoint].q == undefined
              }
              value={
                (selectedPoint != null && filterDefs[selectedPoint].q) ||
                0
              }
              onChange={(value) => {
                if (selectedPoint == undefined) {
                  return;
                }

                setFilterDefs(
                  produce(filterDefs, (draft) => {
                    draft[selectedPoint].q = value;
                  }),
                );
              }}
              step={0.1}
              parseAs="float"
              min={0.1}
              max={24}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
