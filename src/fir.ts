import { PyodideInterface } from "pyodide";

declare global {
  interface Window {
    loadPyodide: () => Promise<PyodideInterface>;
  }
}

let _p: PyodideInterface | undefined;

async function getPyodide() {
  if (!_p) {
    _p = await window.loadPyodide();
    await _p.loadPackage("scipy");
  }

  return _p;
}

export async function calculateTaps(
  numtaps: number,
  freqs: number[],
  gains: number[]
) {
  const p = await getPyodide();

  let firwin2 = p.runPython(`
        import scipy.signal

        def firwin2(numtaps, freqs, gains):
            return scipy.signal.firwin2(numtaps, freqs.to_py(), gains.to_py(), fs=48000)

        firwin2
    `);

  return firwin2(numtaps, freqs, gains).toJs();
}

export async function frequencyResponse(
  taps: number[]
): Promise<[number[], number[]]> {
  const p = await getPyodide();

  let freqz = p.runPython(`
        import scipy.signal
        import numpy

        def freqz(taps):
          w, h = scipy.signal.freqz(taps.to_py(), [1], worN=4096, fs=48000)
          gain = list(map(lambda x: numpy.absolute(x), h))
          return w, gain

        freqz
    `);

  return freqz(taps).toJs();
}
