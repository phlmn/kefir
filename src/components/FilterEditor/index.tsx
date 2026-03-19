import { FilterResponse } from '@thi.ng/dsp';
import { FilterEditorChart } from './Chart';
import { FilterEditorKnobs } from './Knobs';
import {
  allpass2Fn,
  allpassFn,
  combineResponses,
  hpButterworth2Fn,
  hpButterworth4Fn,
  hpButterworth6Fn,
  hpButterworth8Fn,
  hpLinkwitzRiley2Fn,
  hpLinkwitzRiley4Fn,
  hpLinkwitzRiley8Fn,
  lpButterworth2Fn,
  lpButterworth4Fn,
  lpButterworth6Fn,
  lpButterworth8Fn,
  lpLinkwitzRiley2Fn,
  lpLinkwitzRiley4Fn,
  lpLinkwitzRiley8Fn,
  peakFilterFn,
} from './filterFunctions';

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
  return (
    <div>
      <FilterEditorChart
        filterDefs={filterDefs}
        setFilterDefs={setFilterDefs}
        computedGain={computedGain}
        computedPhase={computedPhase}
        selectedPoint={selectedPoint}
        onSelectedPointChange={onSelectedPointChange}
      />
      <FilterEditorKnobs
        filterDefs={filterDefs}
        selectedPoint={selectedPoint}
        setFilterDefs={setFilterDefs}
      />
    </div>
  );
}

export type Filter = {
  type: keyof typeof filterMap;
  frequency: number;
  gain: number;
  q: number;
  enabled: boolean;
};

export function dbToAmplitude(db: number) {
  return Math.pow(10, db / 20);
}

export function amplitudeToDb(amp: number) {
  return Math.log10(amp) * 20;
}

const filterMap = {
  peak: peakFilterFn,
  allpass: allpassFn,
  allpass2: allpass2Fn,

  lpButterworth2: lpButterworth2Fn,
  lpButterworth4: lpButterworth4Fn,
  lpButterworth6: lpButterworth6Fn,
  lpButterworth8: lpButterworth8Fn,
  lpLinkwitzRiley2: lpLinkwitzRiley2Fn,
  lpLinkwitzRiley4: lpLinkwitzRiley4Fn,
  lpLinkwitzRiley8: lpLinkwitzRiley8Fn,

  hpButterworth2: hpButterworth2Fn,
  hpButterworth4: hpButterworth4Fn,
  hpButterworth6: hpButterworth6Fn,
  hpButterworth8: hpButterworth8Fn,
  hpLinkwitzRiley2: hpLinkwitzRiley2Fn,
  hpLinkwitzRiley4: hpLinkwitzRiley4Fn,
  hpLinkwitzRiley8: hpLinkwitzRiley8Fn,
} as const;

export function filterFnFromDef(def: any) {
  const { type, ...opts } = def;
  const createFilterFn = filterMap[type as keyof typeof filterMap];
  return createFilterFn(opts);
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
  filters: Array<(f: number) => FilterResponse>,
  frequencies: number[],
) {
  return frequencies.map((freq) => combineResponses(filters.map((fn) => fn(freq))));
}
