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
import './index.css';

import {
  calculateTaps,
  frequencyResponse,
  getPyodide,
  minimumPhase,
} from './fir';
import {
  buildConfig,
  saveConfig,
  sendConfig,
  ChannelSettings as ChannelSettingsType,
} from './config';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useLocalStorage } from './useLocalStorage';
import { ChannelSettings } from './ChannelSettings';
import { CheckboxLabel } from './components/Label';

getPyodide();

export function App() {
  const ntaps = 4800;
  const fs = 48000;

  const [houseFilters, setHouseFilters] = useLocalStorage(
    'houseFilters',
    [] as Filter[],
  );
  const [bassFilters, setBassFilters] = useLocalStorage(
    'bassFilters',
    [] as Filter[],
  );
  const [topsFilters, setTopsFilters] = useLocalStorage(
    'topsFilters',
    [] as Filter[],
  );

  const [isMinimumPhase, setMinimumPhase] = useState(true);

  const [channelSettings, setChannelSettings] = useLocalStorage<
    ChannelSettingsType[]
  >(
    'channelSettings',
    Array(4)
      .fill(null)
      .map(
        () =>
          ({
            delayInMs: 0,
            source: 0,
            gain: 0,
            inverted: false,
            limiter: {
              threshold: 0,
              rmsSamples: 256,
              decay: 12,
            },
            firTaps: [],
          } as ChannelSettingsType),
      ),
  );

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
      filters.filter((f) => f.enabled).map((def) => filterFromDef(def)),
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

    const updatedChannelSettings = channelSettings.map(
      (settings: ChannelSettingsType, index: number) => ({
        ...settings,
        firTaps: index < 2 ? topsFilter.taps : bassFilter.taps,
      }),
    );

    const config = buildConfig(
      [{ gain: 0 }, { gain: 0 }],
      updatedChannelSettings,
    );

    await sendConfig(config);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Frequency Response Editor
        </h1>
        <Tabs className="bg-white rounded-lg shadow">
          <TabList className="border-b border-gray-200 px-6">
            <Tab className="py-4 px-6 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent cursor-pointer focus:outline-none focus:text-gray-700 focus:border-gray-300 data-[selected]:text-blue-600 data-[selected]:border-blue-600">
              House Curve
            </Tab>
            <Tab className="py-4 px-6 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent cursor-pointer focus:outline-none focus:text-gray-700 focus:border-gray-300 data-[selected]:text-blue-600 data-[selected]:border-blue-600">
              Bass
            </Tab>
            <Tab className="py-4 px-6 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent cursor-pointer focus:outline-none focus:text-gray-700 focus:border-gray-300 data-[selected]:text-blue-600 data-[selected]:border-blue-600">
              Tops
            </Tab>
            <Tab className="py-4 px-6 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent cursor-pointer focus:outline-none focus:text-gray-700 focus:border-gray-300 data-[selected]:text-blue-600 data-[selected]:border-blue-600">
              Channel 1
            </Tab>
            <Tab className="py-4 px-6 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent cursor-pointer focus:outline-none focus:text-gray-700 focus:border-gray-300 data-[selected]:text-blue-600 data-[selected]:border-blue-600">
              Channel 2
            </Tab>
            <Tab className="py-4 px-6 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent cursor-pointer focus:outline-none focus:text-gray-700 focus:border-gray-300 data-[selected]:text-blue-600 data-[selected]:border-blue-600">
              Channel 3
            </Tab>
            <Tab className="py-4 px-6 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent cursor-pointer focus:outline-none focus:text-gray-700 focus:border-gray-300 data-[selected]:text-blue-600 data-[selected]:border-blue-600">
              Channel 4
            </Tab>
          </TabList>

          <TabPanel className="p-6">
            <FilterEditor
              filterDefs={houseFilters}
              setFilterDefs={setHouseFilters}
            />
          </TabPanel>
          <TabPanel className="p-6">
            <FilterEditor
              filterDefs={bassFilters}
              setFilterDefs={setBassFilters}
              computedGain={computedFilterBass?.gain}
              computedPhase={computedFilterBass?.phase}
            />
          </TabPanel>
          <TabPanel className="p-6">
            <FilterEditor
              filterDefs={topsFilters}
              setFilterDefs={setTopsFilters}
              computedGain={computedFilterTops?.gain}
              computedPhase={computedFilterTops?.phase}
            />
          </TabPanel>
          <TabPanel className="p-6">
            <ChannelSettings
              settings={channelSettings[0]}
              onChange={(settings) => {
                const newChannelSettings = [...channelSettings];
                newChannelSettings[0] = settings;
                setChannelSettings(newChannelSettings);
              }}
            />
          </TabPanel>
          <TabPanel className="p-6">
            <ChannelSettings
              settings={channelSettings[1]}
              onChange={(settings) => {
                const newChannelSettings = [...channelSettings];
                newChannelSettings[1] = settings;
                setChannelSettings(newChannelSettings);
              }}
            />
          </TabPanel>
          <TabPanel className="p-6">
            <ChannelSettings
              settings={channelSettings[2]}
              onChange={(settings) => {
                const newChannelSettings = [...channelSettings];
                newChannelSettings[2] = settings;
                setChannelSettings(newChannelSettings);
              }}
            />
          </TabPanel>
          <TabPanel className="p-6">
            <ChannelSettings
              settings={channelSettings[3]}
              onChange={(settings) => {
                const newChannelSettings = [...channelSettings];
                newChannelSettings[3] = settings;
                setChannelSettings(newChannelSettings);
              }}
            />
          </TabPanel>
        </Tabs>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <CheckboxLabel
            className="mb-6"
            input={
              <input
                type="checkbox"
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={isMinimumPhase}
                onChange={(e) => setMinimumPhase(!isMinimumPhase)}
              />
            }
          >
            Minimum phase
          </CheckboxLabel>
          <div className="space-x-4">
            <button
              onClick={calculate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Apply
            </button>
            <button
              onClick={saveConfig}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Store Config
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(<App />);
