import { createContext, useContext, useEffect, useState } from 'react';
import { useRemoteState } from './useLocalStorage';
import {
  sendConfig,
  ChannelSettings as ChannelSettingsType,
  buildConfig,
  LinkSettings,
  saveConfig,
} from './config';
import { send, ws } from './ws';
import { calculateFirFilter, ComputedFirFilter } from './firFilter';
import { SwitchableFilterDef } from './components/FilterEditor';

function useGlobalStateInner(config: any) {
  const [houseFilters, setHouseFilters] = useRemoteState(
    config,
    'houseFilters',
    [] as SwitchableFilterDef[],
  );

  const [bypassHouseCurve, setBypassHouseCurve] = useRemoteState(
    config,
    'bypassHouseCurve',
    false,
  );

  const [bypassChannelFilters, setBypassChannelFilters] = useRemoteState(
    config,
    'bypassChannelFilters',
    false,
  );

  const [playbackSignalsRms, setPlaybackSignalsRms] = useState<number[]>([]);
  const [playbackSignalsPeak, setPlaybackSignalsPeak] = useState<number[]>([]);

  const [captureSignalsRms, setCaptureSignalsRms] = useState<number[]>([]);
  const [captureSignalsPeak, setCaptureSignalsPeak] = useState<number[]>([]);

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

  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(async () => {
      const rmsRes = await send('GetPlaybackSignalRms');
      setPlaybackSignalsRms(rmsRes);

      const peakRes = await send('GetPlaybackSignalPeak');
      setPlaybackSignalsPeak(peakRes);

      const captureRmsRes = await send('GetCaptureSignalRms');
      setCaptureSignalsRms(captureRmsRes);

      const capturePeakRes = await send('GetCaptureSignalPeak');
      setCaptureSignalsPeak(capturePeakRes);
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [isConnected]);

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
    gain: 0,
    limiter: {
      enabled: true,
      threshold: 0,
      rmsSamples: 256,
      decay: 12,
    },
    firTaps: [],
    iirFilters: [],
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

      if (!migratedChannel.iirFilters) {
        migratedChannel = {
          ...migratedChannel,
          iirFilters: [],
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

  const [channelSettingsRaw, setChannelSettingsRaw] = useRemoteState<
    ChannelSettingsType[]
  >(
    config,
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

  const [linkSettings, setLinkSettings] = useRemoteState<LinkSettings>(
    config,
    'linkSettings',
    { delay: [], gain: [], iirFilters: [], limiter: [] },
  );

  const [computedFilterBass, setComputedFilterBass] = useState(
    undefined as undefined | ComputedFirFilter,
  );
  const [computedFilterTops, setComputedFilterTops] = useState(
    undefined as undefined | ComputedFirFilter,
  );

  const calculate = async () => {
    const updatedChannelSettings = channelSettings.map(
      (settings: ChannelSettingsType, index: number) => ({
        ...settings,
        iirFilters: bypassChannelFilters ? [] : settings.iirFilters,
        firTaps: bypassChannelFilters ? [] : settings.firTaps,
      }),
    );

    const config = buildConfig(
      Array(8).fill({ gain: 0 }),
      updatedChannelSettings,
      linkSettings,
      bypassHouseCurve ? [] : houseFilters,
    );

    await sendSettingsToBackend({
      linkSettings,
      systemPresets,
      currentSystemPreset,
      channelSettings: channelSettingsRaw,
      houseFilters,
      bypassChannelFilters,
      bypassHouseCurve,
      loudspeakerPresets,
    });
    await sendConfig(config);
    await saveConfig();
  };

  const [loudspeakerPresets, setLoudspeakerPresets] = useRemoteState<
    LoudspeakerPreset[]
  >(config, 'loudspeakerPresets', []);

  const [systemPresets, setSystemPresets] = useRemoteState<SystemPreset[]>(
    config,
    'systemPresets',
    [],
  );

  const [currentSystemPreset, setCurrentSystemPreset] = useRemoteState<
    string | undefined
  >(config, 'currentSystemPreset', undefined);

  return {
    calculate,
    channelSettings,
    setChannelSettings,
    linkSettings,
    setLinkSettings,
    computedFilterBass,
    computedFilterTops,
    setHouseFilters,
    houseFilters,
    captureSignalsPeak,
    captureSignalsRms,
    playbackSignalsRms,
    playbackSignalsPeak,
    isConnected,
    sendConfig,
    bypassHouseCurve,
    setBypassHouseCurve,
    loudspeakerPresets,
    setLoudspeakerPresets,
    systemPresets,
    setSystemPresets,
    currentSystemPreset,
    setCurrentSystemPreset,
    bypassChannelFilters,
    setBypassChannelFilters,
  };
}

export type LoudspeakerPreset = {
  name: string;
  settings: Partial<ChannelSettingsType>;
};

export type SystemPreset = {
  name: string;
  channelSettings: ChannelSettingsType[];
  houseFilters: SwitchableFilterDef[];
  linkSettings: LinkSettings;
};

export const GlobalStateContext = createContext<ReturnType<
  typeof useGlobalStateInner
> | null>(null);

export const GlobalStateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => Promise.all([res, res.json()]))
      .then(([res, fetchedConfig]) => {
        if (res.ok) {
          setConfig(fetchedConfig);
        }
      });
  }, []);

  if (!config) {
    return <p>Loading...</p>;
  }

  return <InnerProvider config={config}>{children}</InnerProvider>;
};

const InnerProvider = ({
  children,
  config,
}: {
  children: React.ReactNode;
  config: any;
}) => {
  const globalState = useGlobalStateInner(config);

  return (
    <GlobalStateContext.Provider value={globalState}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);

  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }

  return context;
};


async function sendSettingsToBackend(settings: any) {
  await fetch("/api/config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings)
  });
}
