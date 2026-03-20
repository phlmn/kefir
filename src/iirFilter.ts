import {
  biquadHP,
  biquadLP,
  biquadPeak,
  FilterConfig,
  filterResponse,
} from '@thi.ng/dsp';
import { combineResponses } from './filters';

const FS = 48000;

export type FilterDef = {
  type: keyof typeof filterMap;
  frequency: number;
  gain: number;
  q: number;
};

export const peakFilterCoeffs = ({
  frequency,
  gain,
  q,
}: {
  frequency: number;
  gain: number;
  q: number;
}) => {
  return biquadPeak(frequency / FS, q, gain).filterCoeffs();
};

function cascadingBiquadLpCoeffs(frequency: number, qs: number[]) {
  return qs.map((q) => biquadLP(frequency / FS, q).filterCoeffs());
}

// Coefficients from:
// https://www.hxaudiolab.com/uploads/2/5/5/3/25532092/cascading_biquads_to_create_even-order_highlow_pass_filters_2.pdf
// https://github.com/HEnquist/camilladsp/blob/master/filterfunctions.md

export const lpButterworth2Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadLpCoeffs(frequency, [0.71]);

export const lpButterworth4Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadLpCoeffs(frequency, [0.54, 1.31]);

export const lpButterworth6Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadLpCoeffs(frequency, [0.54, 0.71, 1.93]);

export const lpButterworth8Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadLpCoeffs(frequency, [0.51, 0.6, 0.9, 2.56]);

export const lpLinkwitzRiley2Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadLpCoeffs(frequency, [0.5]);

export const lpLinkwitzRiley4Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadLpCoeffs(frequency, [0.71, 0.71]);

export const lpLinkwitzRiley8Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadLpCoeffs(frequency, [0.54, 1.31, 0.54, 1.31]);

function cascadingBiquadHpCoeffs(frequency: number, qs: number[]) {
  return qs.map((q) => biquadHP(frequency / FS, q).filterCoeffs());
  // return (f: number) =>
  //   combineResponses(coeffs.map((c) => filterResponse(c, f / FS)));
}

// Coefficients from:
// https://www.hxaudiolab.com/uploads/2/5/5/3/25532092/cascading_biquads_to_create_even-order_highlow_pass_filters_2.pdf
// https://github.com/HEnquist/camilladsp/blob/master/filterfunctions.md

export const hpButterworth2Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadHpCoeffs(frequency, [0.71]);

export const hpButterworth4Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadHpCoeffs(frequency, [0.54, 1.31]);

export const hpButterworth6Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadHpCoeffs(frequency, [0.54, 0.71, 1.93]);

export const hpButterworth8Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadHpCoeffs(frequency, [0.51, 0.6, 0.9, 2.56]);

export const hpLinkwitzRiley2Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadHpCoeffs(frequency, [0.5]);

export const hpLinkwitzRiley4Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadHpCoeffs(frequency, [0.71, 0.71]);

export const hpLinkwitzRiley8Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadHpCoeffs(frequency, [0.54, 1.31, 0.54, 1.31]);

export function allpassCoeffs({
  frequency,
  q,
}: {
  frequency: number;
  q: number;
}) {
  const omega = (2 * Math.PI * frequency) / FS;
  const alpha = Math.sin(omega) / (2 * q);
  const coeffs: FilterConfig = {
    zeroes: [1 + alpha, -2 * Math.cos(omega), 1 - alpha],
    poles: [1 - alpha, -2 * Math.cos(omega), 1 + alpha],
  };

  return coeffs;
}

export function allpass2Coeffs({
  frequency,
  q,
}: {
  frequency: number;
  q: number;
}) {
  const a1 = allpassCoeffs({ frequency, q });
  return [a1, a1];
}

const filterMap = {
  peak: peakFilterCoeffs,
  allpass: allpassCoeffs,
  allpass2: allpass2Coeffs,

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

export function coeffsFromDef(def: FilterDef): FilterConfig[] {
  const { type, ...opts } = def;
  const coeffsFn = filterMap[type as keyof typeof filterMap];
  const coeffs = coeffsFn(opts);

  if (Array.isArray(coeffs)) {
    return coeffs;
  } else {
    return [coeffs];
  }
}

export function filterFnFromDef(def: FilterDef) {
  const coeffs = coeffsFromDef(def);
  return (freq: number) => combineResponses(coeffs.map((c) => filterResponse(c, freq / FS)));
}

export function coeffParams(filter: FilterConfig) {
  // should be the reverse of this code, but a and b are swapped:
  // {
  //   zeroes: [this._a0, this._a1, this._a2],
  //   poles: [1, this._b1, this._b2]
  // }
  return {
    a1: filter.poles[1],
    a2: filter.poles[2],
    b0: filter.zeroes[0],
    b1: filter.zeroes[1],
    b2: filter.zeroes[2],
  };
}
