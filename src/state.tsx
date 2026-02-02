import { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { sendConfig,   ChannelSettings as ChannelSettingsType, buildConfig, } from "./config";
import { amplitudeToDb, dbToAmplitude, Filter, filterFromDef, freqencyResponse, samplingFrequencies } from "./components/FilterEditor";
import { send, ws } from "./ws";
import { calculateTaps, frequencyResponse, minimumPhase } from "./fir";

function useGlobalStateInner() {
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

  const [playbackSignalsRms, setPlaybackSignalsRms] = useState<number[]>([]);
  const [playbackSignalsPeak, setPlaybackSignalsPeak] = useState<number[]>([]);

  const [captureSignalsRms, setCaptureSignalsRms] = useState<number[]>([]);
  const [captureSignalsPeak, setCaptureSignalsPeak] = useState<number[]>([]);

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

  return {
    calculate,
    channelSettings,
    computedFilterBass,
    computedFilterTops,
    setBassFilters,
    setTopsFilters,
    setHouseFilters,
    bassFilters,
    topsFilters,
    houseFilters,
    captureSignalsPeak,
    captureSignalsRms,
    setChannelSettings,
    playbackSignalsRms,
    playbackSignalsPeak,
    isConnected,
    sendConfig,
    bypassHouseCurve,
    setBypassHouseCurve,
  };
}

export const GlobalStateContext = createContext<ReturnType<typeof useGlobalStateInner> | null>(null);

export const GlobalStateProvider = ({ children }: { children: React.ReactNode }) => {
  const globalState = useGlobalStateInner();

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
