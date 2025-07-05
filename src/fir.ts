import { PyodideInterface } from 'pyodide';

declare global {
  interface Window {
    loadPyodide: (options?: { indexURL?: string }) => Promise<PyodideInterface>;
  }
}

let _p: PyodideInterface | undefined;

let promise: Promise<PyodideInterface> | undefined;

export async function getPyodide() {
  if (!_p) {
    if (!promise) {
      promise = window.loadPyodide({
        indexURL: '/pyodide/'
      });
    }

    _p = await promise;

    // Load packages in the correct order
    console.info('Loading packages...');
    try {
      // Load numpy first as it's a dependency for scipy
      console.info('Loading numpy...');
      await _p.loadPackage('numpy');

      console.info('Loading scipy...');
      await _p.loadPackage('scipy');

      console.info('Packages loaded successfully');
    } catch (error) {
      console.warn('Some packages failed to load, trying fallback approach:', error);
      // The packages may still be available even if loadPackage fails
    }

    console.info('importing python dependencies');
    try {
      await _p.runPythonAsync(`
            import numpy as np
            print("NumPy imported successfully")

            import scipy
            import scipy.signal
            import scipy.fft
            print("SciPy imported successfully")
          `);
      console.info('All Python dependencies imported successfully');
    } catch (error) {
      console.error('Failed to import Python dependencies:', error);
      throw error;
    }
  }

  return _p;
}

function makePythonFunction(code: string) {
  return async (...args: any[]) => {
    const p = await getPyodide();

    // Make sure the imports are available in the function scope
    let fn = p.runPython(`
import scipy
import scipy.signal
import scipy.fft
import numpy as np

${code}
fn`);
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
