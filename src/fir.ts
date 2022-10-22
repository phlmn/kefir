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
  }

  return _p;
}

export async function calculateTaps(
  numtaps: number,
  freqs: number[],
  gains: number[],
) {
  const p = await getPyodide();

  let fn = p.runPython(`
    import scipy.signal

    def fn(numtaps, freqs, gains):
      return scipy.signal.firwin2(numtaps, freqs.to_py(), gains.to_py(), fs=48000)

    fn
  `);

  return fn(numtaps, freqs, gains).toJs();
}

export async function frequencyResponse(
  taps: number[],
  frequencies: number[],
): Promise<[number[], number[]]> {
  const p = await getPyodide();

  let fn = p.runPython(`
    import scipy.signal
    import scipy.fft
    import numpy

    def fn(taps, frequencies):
      w, h = scipy.signal.freqz(taps.to_py(), [1], worN=frequencies.to_py(), fs=48000)
      gain = numpy.absolute(h)
      return w, gain

    fn
  `);

  return fn(taps, frequencies).toJs();
}
