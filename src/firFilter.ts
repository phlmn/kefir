import { amplitudeToDb, dbToAmplitude } from './dbConversion';
import { frequencyResponse, samplingFrequencies } from './filters';
import { FilterDef, filterFnFromDef } from './iirFilter';
import {
  calculateTaps,
  frequencyResponseFromFir,
  calculateMinimumPhase,
} from './scipy';

export type ComputedFirFilter = {
  taps: number[];
  gain: { x: number; y: number }[];
  phase: { x: number; y: number }[];
};

export const calculateFirFilter = async (
  filters: FilterDef[],
  fs: number,
  ntaps: number,
  minimumPhase: boolean,
): Promise<ComputedFirFilter> => {
  const frequencies = samplingFrequencies();
  const masterData = frequencyResponse(
    filters.map((def) => filterFnFromDef(def)),
    frequencies,
  );
  let taps = await calculateTaps(
    ntaps,
    [0, ...frequencies, fs / 2],
    [
      dbToAmplitude(masterData[0].mag) * 2,
      ...masterData.map(
        (d) => (minimumPhase ? dbToAmplitude(d.mag) : 1) * dbToAmplitude(d.mag),
      ),
      0,
    ],
  );
  if (minimumPhase) {
    taps = await calculateMinimumPhase(taps);
  }
  taps = [...taps]; // we convert the maybe Float64Array to number[]
  const [w, gainRaw, phaseRaw] = await frequencyResponseFromFir(
    taps,
    frequencies,
  );
  const gain = new Array(...w).map((freq, i) => {
    return { x: freq, y: amplitudeToDb(gainRaw[i]) };
  });
  const phase = new Array(...w).map((freq, i) => {
    return { x: freq, y: phaseRaw[i] };
  });

  return { taps, gain, phase };
};
