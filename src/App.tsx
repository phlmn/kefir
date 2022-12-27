import ReactDOM from 'react-dom/client';
import React, { useState } from 'react';
import {
  amplitudeToDb,
  dbToAmplitude,
  Filter,
  FilterEditor,
  filterFromDef,
  freqencyResponse,
  samplingFrequencies,
} from './FilterEditor';
import 'milligram';

import {
  calculateTaps,
  frequencyResponse,
  getPyodide,
  minimumPhase,
} from './fir';
import { sendConfig } from './config';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

getPyodide();

export function App() {
  const ntaps = 4800;
  const fs = 48000;

  const [houseFilters, setHouseFilters] = useState([] as Filter[]);
  const [bassFilters, setBassFilters] = useState([] as Filter[]);
  const [topsFilters, setTopsFilters] = useState([] as Filter[]);

  const [isMinimumPhase, setMinimumPhase] = useState(true);

  type ComputedFilter = {
    taps: number[];
    gain: { x: number; y: number }[];
    phase: { x: number; y: number }[];
  };
  const [computedFilterBass, setComputedFilterBass] = useState(
    undefined as undefined | ComputedFilter,
  );
  const [computedFilterTops, setComputedFilterTops] = useState(
    undefined as undefined | ComputedFilter,
  );

  const calculateFilters = async (
    filters: Filter[],
  ): Promise<ComputedFilter> => {
    const frequencies = samplingFrequencies();
    let masterData = freqencyResponse(
      filters.map((def) => filterFromDef(def)),
      frequencies,
    );
    console.log(frequencies, masterData);
    let taps = await calculateTaps(
      ntaps,
      [0, ...frequencies, fs / 2],
      [
        dbToAmplitude(masterData[0]) * 2,
        ...masterData.map(
          (d) => (isMinimumPhase ? dbToAmplitude(d) : 1) * dbToAmplitude(d),
        ),
        0,
      ],
    );
    if (isMinimumPhase) {
      taps = await minimumPhase(taps);
    }
    taps = [...taps]; // we convert the maybe Float64Array to number[]
    const [w, gainRaw, phaseRaw] = await frequencyResponse(taps, frequencies);
    const gain = new Array(...w).map((freq, i) => {
      return { x: freq, y: amplitudeToDb(gainRaw[i]) };
    });
    const phase = new Array(...w).map((freq, i) => {
      return { x: freq, y: phaseRaw[i] };
    });

    return { taps, gain, phase };
  };

  const calculate = async () => {
    const bassFilter = await calculateFilters([
      ...houseFilters,
      ...bassFilters,
    ]);
    setComputedFilterBass(bassFilter);
    const topsFilter = await calculateFilters([
      ...houseFilters,
      ...topsFilters,
    ]);
    setComputedFilterTops(topsFilter);

    await sendConfig(bassFilter.taps, topsFilter.taps);
  };

  return (
    <main className="wrapper">
      <section className="container">
        <h1>Frequency Response Editor</h1>
        <Tabs>
          <TabList>
            <Tab>House Curve</Tab>
            <Tab>Bass</Tab>
            <Tab>Tops</Tab>
          </TabList>

          <TabPanel>
            <FilterEditor
              filterDefs={houseFilters}
              setFilterDefs={setHouseFilters}
            />
          </TabPanel>
          <TabPanel>
            <FilterEditor
              filterDefs={bassFilters}
              setFilterDefs={setBassFilters}
              computedGain={computedFilterBass?.gain}
              computedPhase={computedFilterBass?.phase}
            />
          </TabPanel>
          <TabPanel>
            <FilterEditor
              filterDefs={topsFilters}
              setFilterDefs={setTopsFilters}
              computedGain={computedFilterTops?.gain}
              computedPhase={computedFilterTops?.phase}
            />
          </TabPanel>
        </Tabs>
      </section>

      <section className="container">
        <label style={{ display: 'inline-block', padding: '30px' }}>
          <input
            type="checkbox"
            checked={isMinimumPhase}
            onChange={(e) => setMinimumPhase(!isMinimumPhase)}
          />
          minimum phase
        </label>

        <button onClick={calculate}>calculate filter</button>
      </section>
    </main>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(<App />);
