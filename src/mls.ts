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
          from scipy.signal import max_len_seq, correlate
          import scipy.signal
          import numpy as np
          from numpy.fft import fft
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

export const generateMLS: (
    numbits: number,
) => Promise<number[]> = makePythonFunction(`
def fn(nbits):
    taps = np.array(scipy.signal._max_len_seq._mls_taps[nbits], np.int)
    n_max = (2**nbits) - 1
    length = n_max
    state = np.ones(nbits, dtype=np.int8, order='c')
    seq = np.empty(length, dtype=np.int8, order='c')

    state = scipy.signal._max_len_seq._max_len_seq_inner(taps, state, nbits, length, seq)

    return seq.astype(np.float32)
`);

export const analyzeMLS: (
    seq: Float32Array,
    recording: Float32Array,
) => Promise<Float32Array[]> = makePythonFunction(`
def fn(seq, rec):
    crosscorr = scipy.signal.correlate(seq.to_py(), rec.to_py(),"same")# [len(recorded)//2:]
    fft = scipy.fft.rfft(crosscorr)
    return np.abs(fft), np.angle(fft)
`);

// export const ifft: (
//     gain: number[],
//     phase: number[],
// ) => Promise<[number[], number[]]> = makePythonFunction(`
// def fn(gain, phase):
//     gain = np.array(gain.to_py())
//     phase = np.array(phase.to_py())
//     complex = gain * np.exp(1j*phase)
//     transformed = scipy.fft.ifft(complex)
//     return np.real(transformed), np.imag(transformed)
// `);

// export const minimumPhase: (taps: number[]) => Promise<number[]> =
//     makePythonFunction(`
// def fn(taps):
//     return scipy.signal.minimum_phase(taps.to_py())
// `);

// export const frequencyResponse: (
//     taps: number[],
//     frequencies: number[],
// ) => Promise<[number[], number[], number[]]> = makePythonFunction(`
// def fn(taps, frequencies):
//   w, h = scipy.signal.freqz(taps.to_py(), [1], worN=frequencies.to_py(), fs=48000)
//   gain = np.absolute(h)
//   phase = np.angle(h, deg=True)
//   return w, gain, phase
// `);
