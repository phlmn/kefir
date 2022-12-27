import React, { SyntheticEvent, useRef, useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import {
  SVGCoordinateType,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
  Selection,
} from 'victory';

import { biquadPeak } from '@thi.ng/dsp/biquad';
import { filterResponse } from '@thi.ng/dsp/filter-response';

import { getPyodide, generateMLS, analyzeMLS } from './mls';

getPyodide();

// one-liner to sum the values in an array
function sum(a) {
  return a.reduce(function(a, b) {
    return a + b;
  }, 0);
}

// call this with an array of Uint8Array objects
function bufjoin(bufs) {
  var lens = bufs.map(function(a) {
    return a.length;
  });
  var aout = new Float32Array(sum(lens));
  for (var i = 0; i < bufs.length; ++i) {
    var start = sum(lens.slice(0, i));
    aout.set(bufs[i], start); // copy bufs[i] to aout at start position
  }
  return aout;
}

const dbToAxis = (x: Array<{ x: number; y: number }>) =>
  x.map(x => ({ ...x, y: x.y }));
const degToAxis = (x: Array<{ x: number; y: number }>) =>
  x.map(x => ({ ...x, y: x.y }));

function App() {
  const [numbits, setNumBits] = useState(16);
  const audioCtxRef = useRef<AudioContext | undefined>();
  const [recData, setRecData] = useState<Float32Array | undefined>();
  const [frequencyResponse, setFrequencyResponse] = useState<
    Float32Array | undefined
  >();
  const [phaseResponse, setPhaseResponse] = useState<
    Float32Array | undefined
  >();

  return (
    <div>
      <button
        onClick={async () => {
          if (audioCtxRef.current === undefined) {
            audioCtxRef.current = new AudioContext();
          }
          let samples = await generateMLS(numbits);
          const buffer = new AudioBuffer({
            numberOfChannels: 1,
            length: samples.length,
            sampleRate: audioCtxRef.current.sampleRate,
          });

          buffer.copyToChannel(samples, 0);
          const source = audioCtxRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtxRef.current.destination);

          const stream = await navigator.mediaDevices
            .getUserMedia({
              audio: true,
            })
            .catch(err => {
              console.error(
                `The following getUserMedia error occurred: ${err}`,
              );
            });

          const recSource = audioCtxRef.current.createMediaStreamSource(stream);
          console.log(recSource);
          const captureNode = audioCtxRef.current.createScriptProcessor(
            8192,
            1,
            1,
          );
          const nullGain = audioCtxRef.current.createGain();
          nullGain.gain.value = 0;
          captureNode.connect(nullGain);
          nullGain.connect(audioCtxRef.current.destination);

          let recordedChunks = [];
          const listener = e => {
            let buf = new Float32Array(8192);
            buf.set(e.inputBuffer.getChannelData(0));
            recordedChunks.push(buf);
          };
          captureNode.addEventListener('audioprocess', listener);
          recSource.connect(captureNode);

          source.start();
          source.onended = async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            captureNode.removeEventListener('audioprocess', listener);
            console.log('White noise finished.');
            console.log(recordedChunks);
            const rData = bufjoin(recordedChunks);
            setRecData(rData);
            const [freq, phase] = await analyzeMLS(samples, rData);
            console.log(rData);
            console.log(freq);
            console.log(phase);
            setFrequencyResponse(freq);
            setPhaseResponse(phase);
          };
        }}
      >
        analyze
      </button>
      <VictoryChart
        style={{ parent: { maxWidth: '1200px' } }}
        theme={VictoryTheme.material}
        scale={{ x: 'log', y: 'linear' }}
        width={1200}
        domain={{ x: [20, 20000], y: [-1, 1] }}
      >
        <VictoryAxis
          label="Gain (db)"
          style={{
            axisLabel: { fontSize: 12, padding: 25 },
            tickLabels: { fontSize: 12, padding: 5 },
            ticks: { stroke: 0 },
            axis: { stroke: 0 },
          }}
          dependentAxis
          tickValues={[-1, -0.5, 0, 0.5, 1]}
          tickFormat={[-20, -10, 0, 10, 20]}
        />
        <VictoryAxis
          label="Phase (deg)"
          orientation={'right'}
          style={{
            axisLabel: { fontSize: 12, padding: 25 },
            tickLabels: { fontSize: 12, padding: 5 },
            ticks: { stroke: 0 },
            axis: { stroke: 0 },
          }}
          dependentAxis
          tickValues={[-1, -0.5, 0, 0.5, 1]}
          tickFormat={[-180, -90, 0, 90, 180]}
        />
        <VictoryAxis
          style={{
            tickLabels: { fontSize: 12, padding: 10 },
            ticks: { size: 0, strokeWidth: 2, strokeLinecap: 'square' },
          }}
          crossAxis
        />
        {frequencyResponse && (
          <VictoryLine
            style={{
              data: {
                strokeWidth: 2,
                stroke: '#aaaaaa',
                strokeDasharray: '2,2',
              },
            }}
            data={dbToAxis(frequencyResponse)}
            interpolation="catmullRom"
          />
        )}
        {phaseResponse && (
          <VictoryLine
            style={{
              data: {
                strokeWidth: 2,
                stroke: '#59f',
                strokeDasharray: '2,2',
              },
            }}
            data={phaseResponse}
            interpolation="catmullRom"
          />
        )}
      </VictoryChart>
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(<App />);
