import ReactDOM from 'react-dom/client';
import { useEffect, useState } from 'react';
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
import { Routing } from './components/Routing';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from './components/Tabs';
import { Button, PopoverButton } from './components/Button';
import { Radio, RulerDimensionLine, Save } from 'lucide-react';
import { Popover, PopoverPanel } from '@headlessui/react';
import { Switch } from './components/Switch';
import { ws } from './ws';
import { cn } from './components/utils';
import { OutputsTab } from './OutputsTab';
import { Card } from './components/Card';

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

  const [bypassHouseCurve, setBypassHouseCurve] = useLocalStorage(
    'bypassHouseCurve',
    false,
  );

  const [isMinimumPhase, setMinimumPhase] = useState(true);

  const [isConnected, setIsConnected] = useState(false);
  useEffect(() => {
    const onOpen = () => setIsConnected(true);
    const onClose = () => setIsConnected(false);

    ws.addEventListener('open', onOpen);
    ws.addEventListener('close', onClose);
    return () => {
      ws.removeEventListener('open', onOpen);
      ws.removeEventListener('close', onClose);
    };
  }, []);

  // Helper function to create default channel settings
  const createDefaultChannelSettings = (
    channelIndex?: number,
  ): ChannelSettingsType => ({
    name:
      channelIndex !== undefined
        ? `Channel ${channelIndex + 1}`
        : 'Unnamed Channel',
    delayInMs: 0,
    sources: [], // Start with no inputs connected (inactive)
    inverted: false,
    limiter: {
      enabled: true,
      threshold: 0,
      rmsSamples: 256,
      decay: 12,
    },
    firTaps: [],
  });

  // Helper function to migrate channel settings from old format and expand to 10 channels
  const migrateChannelSettings = (existing: any[]): ChannelSettingsType[] => {
    if (!existing)
      return Array(10)
        .fill(null)
        .map((_, index) => createDefaultChannelSettings(index));

    const migrated = existing.map((channel: any, index: number) => {
      let migratedChannel = { ...channel };

      // Add name if it doesn't exist
      if (!('name' in migratedChannel)) {
        migratedChannel.name = `Channel ${index + 1}`;
      }

      // Convert old single-source format to new multi-source format
      if ('source' in channel && !('sources' in channel)) {
        migratedChannel = {
          ...migratedChannel,
          sources: [
            {
              channel: channel.source,
              gain: channel.gain || 0,
            },
          ],
          inverted: channel.inverted || false,
          // Remove old properties
          source: undefined,
          gain: undefined,
        };
      }

      // Convert per-source inversion to per-channel inversion
      if ('sources' in migratedChannel && migratedChannel.sources) {
        const hasAnyInvertedSources = migratedChannel.sources.some(
          (s: any) => s.inverted,
        );
        migratedChannel = {
          ...migratedChannel,
          sources: migratedChannel.sources.map((s: any) => ({
            channel: s.channel,
            gain: s.gain,
            // Remove per-source inverted property
          })),
          inverted:
            migratedChannel.inverted !== undefined
              ? migratedChannel.inverted
              : hasAnyInvertedSources,
        };
      }

      return migratedChannel;
    });

    // Fill missing channels with default settings
    while (migrated.length < 10) {
      migrated.push(createDefaultChannelSettings(migrated.length));
    }

    return migrated;
  };

  const [channelSettingsRaw, setChannelSettingsRaw] = useLocalStorage<
    ChannelSettingsType[]
  >(
    'channelSettings',
    Array(10)
      .fill(null)
      .map(() => createDefaultChannelSettings()),
  );

  // Apply migration logic
  const channelSettings = migrateChannelSettings(channelSettingsRaw);

  // Update localStorage if migration occurred
  useEffect(() => {
    if (channelSettingsRaw.length !== 10) {
      setChannelSettingsRaw(channelSettings);
    }
  }, [channelSettings, channelSettingsRaw, setChannelSettingsRaw]);

  const setChannelSettings = (newSettings: ChannelSettingsType[]) => {
    setChannelSettingsRaw(newSettings);
  };

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
        firTaps: index < 2 ? topsFilter.taps : index < 4 ? bassFilter.taps : [],
      }),
    );

    const config = buildConfig(
      Array(8).fill({ gain: 0 }),
      updatedChannelSettings,
    );

    await sendConfig(config);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="border-b-1 border-gray-300 h-15 mb-5 flex items-center px-4 bg-white">
        <div className="font-bold text-xl">keFIR</div>
        <div className="ml-4 bg-gray-800 text-white rounded text-xs px-2 py-0.5 inline-flex items-center">
          <div
            className={cn(
              'ml-0.5 mr-1.5 w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500',
            )}
          ></div>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        <div className="ml-auto space-x-2">
          <Popover className="inline-flex mr-4">
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
            <Tab>Outputs</Tab>
            <Tab>Routing</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Card>
                <FilterEditor
                  filterDefs={houseFilters}
                  setFilterDefs={setHouseFilters}
                />
              </Card>
            </TabPanel>
            <TabPanel>
              <Card>
                <FilterEditor
                  filterDefs={bassFilters}
                  setFilterDefs={setBassFilters}
                  computedGain={computedFilterBass?.gain}
                  computedPhase={computedFilterBass?.phase}
                />
              </Card>
            </TabPanel>
            <TabPanel>
              <Card>
                <FilterEditor
                  filterDefs={topsFilters}
                  setFilterDefs={setTopsFilters}
                  computedGain={computedFilterTops?.gain}
                  computedPhase={computedFilterTops?.phase}
                />
              </Card>
            </TabPanel>
            <TabPanel>
              <OutputsTab
                channelSettings={channelSettings}
                setChannelSettings={setChannelSettings}
              />
            </TabPanel>
            <TabPanel>
              <Routing
                channelSettings={channelSettings}
                onChannelSettingsChange={setChannelSettings}
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
