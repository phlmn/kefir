import ReactDOM from 'react-dom/client';
import { useState } from 'react';
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

import { useLocalStorage } from './useLocalStorage';
import { ChannelSettings } from './ChannelSettings';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from './components/Tabs';
import { Button, PopoverButton } from './components/Button';
import { Radio, RulerDimensionLine, Save } from 'lucide-react';
import { Popover, PopoverPanel } from '@headlessui/react';
import { Switch } from './components/Switch';

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

  const [bypassHouseCurve, setBypassHouseCurve] = useState(false);

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
      ...(bypassHouseCurve ? [] : houseFilters),
      ...bassFilters,
    ]);
    setComputedFilterBass(bassFilter);
    const topsFilter = await calculateFilters([
      ...(bypassHouseCurve ? [] : houseFilters),
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
    <main className="min-h-screen bg-gray-50">
      <div className="border-b-1 border-gray-300 h-15 mb-5 flex items-center px-4">
        <div className="font-bold text-xl">keFIR</div>
        <div className="ml-auto space-x-2">
          <Popover className="inline-flex mr-6">
            <PopoverButton
              size="sm"
              variant="secondary"
              title="Meassurement Utils"
              className={
                bypassHouseCurve
                  ? 'bg-red-700 text-white hover:bg-red-700/80'
                  : ''
              }
            >
              <RulerDimensionLine className="h-4 w-4" />
            </PopoverButton>
            <PopoverPanel
              anchor="bottom"
              className="flex flex-col bg-white py-4 px-6 shadow-2xl rounded-lg mt-1"
            >
              <label className="flex items-center py-2 gap-3">
                <Switch
                  checked={bypassHouseCurve}
                  onCheckedChange={setBypassHouseCurve}
                />{' '}
                Bypass House Curve
              </label>
            </PopoverPanel>
          </Popover>
          <Button variant="secondary" size="sm" onClick={saveConfig}>
            <Save className="h-4 w-4" />
            Store Config
          </Button>
          <Button size="sm" onClick={calculate}>
            <Radio className="h-4 w-4" />
            Apply
          </Button>
        </div>
      </div>
      <section className="px-4">
        <TabGroup>
          <TabList>
            <Tab>House Curve</Tab>
            <Tab>Bass</Tab>
            <Tab>Tops</Tab>
            <Tab>Channel 1</Tab>
            <Tab>Channel 2</Tab>
            <Tab>Channel 3</Tab>
            <Tab>Channel 4</Tab>
          </TabList>
          <TabPanels>
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
          </TabPanels>
        </TabGroup>
      </section>
    </main>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(<App />);
