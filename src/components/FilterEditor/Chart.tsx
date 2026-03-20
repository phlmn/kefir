import React, { SyntheticEvent, useRef, useState } from 'react';
import useResizeObserver from 'use-resize-observer';
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

import { roundToDigits } from '@/lib/round';
import { filterFnFromDef } from '@/iirFilter';
import { frequencyResponse, samplingFrequencies } from '@/filters';
import { SwitchableFilterDef } from '.';

export function FilterEditorChart({
  filterDefs,
  setFilterDefs,
  computedGain,
  computedPhase,
  selectedPoint,
  onSelectedPointChange,
}: {
  filterDefs: SwitchableFilterDef[];
  setFilterDefs: (newFilterDefs: SwitchableFilterDef[]) => void;
  computedGain?: Array<{ x: number; y: number }>;
  computedPhase?: Array<{ x: number; y: number }>;
  selectedPoint: number | null;
  onSelectedPointChange: (point: number | null) => void;
  }) {
  if (selectedPoint != null && !filterDefs[selectedPoint]) {
    selectedPoint = null;
  }

  const filters = filterDefs.filter((f) => f.enabled).map(filterFnFromDef);
  const frequencies = samplingFrequencies();
  const masterReponse = frequencyResponse(filters, frequencies);
  const masterMag = zipToXY(
    frequencies,
    masterReponse.map((r) => r.mag),
  );
  const masterPhase = zipToXY(
    frequencies,
    masterReponse.map((r) => wrapPhase(radToDeg(r.phase))),
  );

  const [dragging, setDragging] = useState(false);

  let selectedData;
  if (selectedPoint != null) {
    const selectedFilter = filterFnFromDef(filterDefs[selectedPoint]);
    if (selectedFilter) {
      selectedData = zipToXY(
        frequencies,
        frequencyResponse([selectedFilter], frequencies).map((r) => r.mag),
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
                padding: 5,
              },
              axisLabel: {
                fontSize: 12,
                padding: 25,
                fill: 'var(--foreground)',
                fontFamily: 'inherit',
              },
              grid: {
                stroke: ({ tick }) =>
                  tick == 0
                    ? 'var(--color-neutral-500)'
                    : 'var(--color-neutral-700)',
                strokeDasharray: ({ tick }) => (tick == 0 ? 0 : '2, 2'),
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
                if (e.detail == 2) {
                  // double click
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
              onMouseUp: (event) => {
                if (dragging) {
                  setDragging(false);
                  containerRef.current?.focus();
                } else {
                  const e = event as React.MouseEvent;
                  if (e.detail == 1) {
                    onSelectedPointChange(null);
                  }
                }
              },
            },
          },
        ]}
        domain={{ x: [20, 20000], y: [-1, 1] }}
      >
        <VictoryAxis
          label="Gain (db)"
          dependentAxis
          tickValues={[-1, -0.5, 0, 0.5, 1]}
          tickFormat={[-20, -10, 0, 10, 20]}
        />
        <VictoryAxis
          label="Phase (deg)"
          orientation={'right'}
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
          style={{
            data: {
              strokeWidth: 1,
              stroke: 'var(--color-red-300)',
              opacity: 0.5,
            },
          }}
          data={degToAxis(masterPhase)}
          interpolation="catmullRom"
        />
        <VictoryLine
          style={{ data: { strokeWidth: 2, stroke: 'var(--color-red-500)' } }}
          data={dbToAxis(masterMag)}
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
  );
}

function zipToXY(x: number[], y: number[]): { x: number; y: number }[] {
  return x.map((x, i) => ({ x, y: y[i] }));
}

function wrapPhase(phaseDeg: number) {
  // modulo in JS behaves weirdly for negative numbers (-1 % 360 = -1, not 359)
  if (phaseDeg < 0) {
    return ((phaseDeg - 180) % 360) + 180;
  } else {
    return ((phaseDeg + 180) % 360) - 180;
  }
}

function radToDeg(rad: number) {
  return (rad * 180) / Math.PI;
}
