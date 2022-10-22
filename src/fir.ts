import {PyodideInterface} from "pyodide";

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
        await _p.loadPackage("scipy");
        console.info("importing python dependencies");
        await _p.runPythonAsync(`
            import scipy.signal
            import scipy.fft
            import numpy
        `);
        console.info("done importing python dependencies");
    }

    return _p;
}

function makePythonFunction(code: string) {
    return async (...args: any[]) => {
        const p = await getPyodide();

        let fn = p.runPython(
            `${code}\n` +
            `fn\n`
        );
        return fn(...args).toJs();
    }
}

export const calculateTaps: ((numtaps: number, freqs: number[], gains: number[]) => Promise<number[]>) = makePythonFunction(`
def fn(numtaps, freqs, gains):
    return scipy.signal.firwin2(numtaps, freqs.to_py(), gains.to_py(), fs=48000)
`)

export const minimumPhase: ((taps: number[]) => Promise<number[]>) = makePythonFunction(`
def fn(taps):
    return scipy.signal.minimum_phase(taps.to_py())
`);

export const frequencyResponse: ((
    taps: number[],
    frequencies: number[]
) => Promise<[number[], number[], number[]]>) = makePythonFunction(`
def fn(taps, frequencies):
    w, h = scipy.signal.freqz(taps.to_py(), [1], worN=frequencies.to_py(), fs=48000)
    gain = numpy.absolute(h)
    phase = numpy.angle(h, deg=True)
    return w, gain, phase
`)
