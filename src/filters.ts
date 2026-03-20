import { FilterResponse } from '@thi.ng/dsp';

export function samplingFrequencies(): number[] {
  const frequencies = [];
  let i = 10;
  while (i < 24000) {
    frequencies.push(i);
    i += i / 40;
  }
  return frequencies;
}

export function frequencyResponse(
  filters: Array<(f: number) => FilterResponse>,
  frequencies: number[],
) {
  return frequencies.map((freq) =>
    combineResponses(filters.map((fn) => fn(freq))),
  );
}

export function combineResponses(
  filterResponses: FilterResponse[],
): FilterResponse {
  return filterResponses.reduce(
    (acc, r) => ({
      freq: r.freq,
      mag: acc.mag + r.mag,
      phase: acc.phase + r.phase,
    }),
    { freq: 0, mag: 0, phase: 0 },
  );
}
