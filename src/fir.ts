import { PyodideInterface } from 'pyodide';

declare global {
  interface Window {
    loadPyodide: () => Promise<PyodideInterface>;
  }
}

let _p: PyodideInterface | undefined;

let promise: Promise<PyodideInterface> | undefined;

export async function getPyodide() {
  if (!_p) {
    if (!promise) {
      promise = window.loadPyodide();
    }

    _p = await promise;
    await _p.loadPackage('scipy');
    console.info('importing python dependencies');
    await _p.runPythonAsync(`
          import scipy.signal
          import scipy.fft
          import numpy as np
        `);
    console.info('done importing python dependencies');
  }

  return _p;
}

function makePythonFunction(code: string) {
  return async (...args: any[]) => {
    const p = await getPyodide();

    let fn = p.runPython(`${code}\n` + `fn\n`);
    return fn(...args).toJs();
  };
}

export const calculateTaps: (
  numtaps: number,
  freqs: number[],
  gains: number[],
) => Promise<number[]> = makePythonFunction(`
def fn(numtaps, freqs, gains):
  return scipy.signal.firwin2(numtaps, freqs.to_py(), gains.to_py(), fs=48000)
`);

export const ifft: (
  gain: number[],
  phase: number[],
) => Promise<[number[], number[]]> = makePythonFunction(`
def fn(gain, phase):
    gain = np.array(gain.to_py())
    phase = np.array(phase.to_py())
    complex = gain * np.exp(1j*phase)
    transformed = scipy.fft.ifft(complex)
    return np.real(transformed), np.imag(transformed)
`);

export const minimumPhase: (taps: number[]) => Promise<number[]> =
  makePythonFunction(`
def fn(taps):
    return scipy.signal.minimum_phase(taps.to_py())
`);

export const frequencyResponse: (
  taps: number[],
  frequencies: number[],
) => Promise<[number[], number[], number[]]> = makePythonFunction(`
def fn(taps, frequencies):
  w, h = scipy.signal.freqz(taps.to_py(), [1], worN=frequencies.to_py(), fs=48000)
  gain = np.absolute(h)
  phase = np.angle(h, deg=True)
  return w, gain, phase
`);

export function estimate_latency(taps: number[]): number {
  const taps_total = taps?.map((x) => x * x)?.reduce((x, acc) => x + acc);
  return taps
    ?.map((x, i) => ((x * x) / (taps_total || 0)) * i * (1000 / 48000))
    .reduce((x, acc) => x + acc);
}
