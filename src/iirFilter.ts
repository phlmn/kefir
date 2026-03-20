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

export const peakFilterFn = ({
  frequency,
  gain,
  q,
}: {
  frequency: number;
  gain: number;
  q: number;
}) => {
  const coeffs = biquadPeak(frequency / FS, q, gain).filterCoeffs();
  return (f: number) => filterResponse(coeffs, f / FS);
};

function cascadingBiquadLpFn(frequency: number, qs: number[]) {
  const coeffs = qs.map((q) => biquadLP(frequency / FS, q).filterCoeffs());
  return (f: number) =>
    combineResponses(coeffs.map((c) => filterResponse(c, f / FS)));
}

// Coefficients from:
// https://www.hxaudiolab.com/uploads/2/5/5/3/25532092/cascading_biquads_to_create_even-order_highlow_pass_filters_2.pdf
// https://github.com/HEnquist/camilladsp/blob/master/filterfunctions.md

export const lpButterworth2Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadLpFn(frequency, [0.71]);

export const lpButterworth4Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadLpFn(frequency, [0.54, 1.31]);

export const lpButterworth6Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadLpFn(frequency, [0.54, 0.71, 1.93]);

export const lpButterworth8Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadLpFn(frequency, [0.51, 0.6, 0.9, 2.56]);

export const lpLinkwitzRiley2Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadLpFn(frequency, [0.5]);

export const lpLinkwitzRiley4Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadLpFn(frequency, [0.71, 0.71]);

export const lpLinkwitzRiley8Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadLpFn(frequency, [0.54, 1.31, 0.54, 1.31]);

function cascadingBiquadHpFn(frequency: number, qs: number[]) {
  const coeffs = qs.map((q) => biquadHP(frequency / FS, q).filterCoeffs());
  return (f: number) =>
    combineResponses(coeffs.map((c) => filterResponse(c, f / FS)));
}

// Coefficients from:
// https://www.hxaudiolab.com/uploads/2/5/5/3/25532092/cascading_biquads_to_create_even-order_highlow_pass_filters_2.pdf
// https://github.com/HEnquist/camilladsp/blob/master/filterfunctions.md

export const hpButterworth2Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadHpFn(frequency, [0.71]);

export const hpButterworth4Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadHpFn(frequency, [0.54, 1.31]);

export const hpButterworth6Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadHpFn(frequency, [0.54, 0.71, 1.93]);

export const hpButterworth8Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadHpFn(frequency, [0.51, 0.6, 0.9, 2.56]);

export const hpLinkwitzRiley2Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadHpFn(frequency, [0.5]);

export const hpLinkwitzRiley4Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadHpFn(frequency, [0.71, 0.71]);

export const hpLinkwitzRiley8Fn = ({ frequency }: { frequency: number }) =>
  cascadingBiquadHpFn(frequency, [0.54, 1.31, 0.54, 1.31]);

export function allpassFn({ frequency, q }: { frequency: number; q: number }) {
  const omega = (2 * Math.PI * frequency) / FS;
  const alpha = Math.sin(omega) / (2 * q);
  const coeffs: FilterConfig = {
    zeroes: [1 + alpha, -2 * Math.cos(omega), 1 - alpha],
    poles: [1 - alpha, -2 * Math.cos(omega), 1 + alpha],
  };
  return (f: number) => filterResponse(coeffs, f / FS);
}

export function allpass2Fn({ frequency, q }: { frequency: number; q: number }) {
  const a1 = allpassFn({ frequency, q });
  return (f: number) => combineResponses([a1(f), a1(f)]);
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

export function filterFnFromDef(def: FilterDef) {
  const { type, ...opts } = def;
  const createFilterFn = filterMap[type as keyof typeof filterMap];
  return createFilterFn(opts);
}
