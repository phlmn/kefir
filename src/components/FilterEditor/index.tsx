import { biquadPeak } from '@thi.ng/dsp/biquad';
import { filterResponse } from '@thi.ng/dsp/filter-response';
import { FilterEditorChart } from './FilterEditorChart';
import { FilterEditorKnobs } from './FilterEditorKnobs';


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

export function filterFnFromDef(def: any) {
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
