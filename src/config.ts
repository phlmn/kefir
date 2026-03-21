import produce from 'immer';
import { SwitchableFilterDef } from './components/FilterEditor';
import { coeffParams, coeffsFromDef } from './iirFilter';
import { send } from './ws';

export type ChannelSettings = {
  name: string;
  delayInMs: number;
  sources: number[];
  inverted: boolean;
  gain: number;
  limiter: {
    enabled: boolean;
    threshold: number;
    rmsSamples: number;
    decay: number;
  };
  firTaps: number[];
  iirFilters: SwitchableFilterDef[];
};

export type InputSettings = {
  gain: number;
};

function createChannelConfig(channel: number, settings: ChannelSettings) {
  const filters = [];

  const filterName = (name: string) => `ch${channel}_${name}`;

  filters.push({
    name: filterName('gain'),
    config: {
      type: 'Gain',
      parameters: {
        gain: settings.gain,
        inverted: settings.inverted,
      },
    },
  });

  filters.push({
    name: filterName('delay'),
    config: {
      type: 'Delay',
      parameters: {
        delay: settings.delayInMs,
        unit: 'ms',
        subsample: false,
      },
    },
  });

  if (settings.firTaps.length > 0) {
    filters.push({
      name: filterName('fir'),
      config: {
        type: 'Conv',
        parameters: {
          values: settings.firTaps,
          type: 'Values',
        },
      },
    });
  }

  settings.iirFilters
    .filter((f) => f.enabled)
    .forEach((filter, filterIdx) => {
      const coeffs = coeffsFromDef(filter);

      coeffs.forEach((c, i) => {
        filters.push({
          name: filterName(`iir_${filterIdx}_${i}`),
          config: {
            type: 'Biquad',
            parameters: {
              type: 'Free',
              ...coeffParams(c),
            },
          },
        });
      });
    });

  if (settings.limiter.enabled) {
    filters.push({
      name: filterName('limiter'),
      config: {
        type: 'RmsLimiter',
        parameters: {
          threshold: settings.limiter.threshold,
          rms_samples: settings.limiter.rmsSamples,
          decay: settings.limiter.decay,
        },
      },
    });
  }

  // Pipelines
  const pipelines = [];
  if (filters.length > 0) {
    pipelines.push({
      type: 'Filter',
      channel: channel,
      names: filters.map((f) => f.name),
    });
  }

  return {
    inverted: settings.inverted,
    filters: filters,
    pipelines: pipelines,
  };
}

export type Link = { from: number; to: number };
export type LinkSettings = {
  delay: Link[];
  gain: Link[];
  limiter: Link[];
  iirFilters: Link[];
};

export function hasLink(
  linkSettings: LinkSettings,
  channel: number,
  type: keyof LinkSettings,
) {
  return linkSettings[type].some(
    ({ from, to }) => from === channel || to === channel,
  );
}

function resolveLinks(channels: ChannelSettings[], links: LinkSettings) {
  return produce(channels, (channels) => {
    links.delay.forEach(({ from, to }) => {
      channels[to].delayInMs = channels[from].delayInMs;
    });

    links.gain.forEach(({ from, to }) => {
      channels[to].gain = channels[from].gain;
    });

    links.limiter.forEach(({ from, to }) => {
      channels[to].limiter = channels[from].limiter;
    });

    links.iirFilters.forEach(({ from, to }) => {
      channels[to].iirFilters = channels[from].iirFilters;
    });
  });
}

export function buildConfig(
  inChannels: InputSettings[],
  channels: ChannelSettings[],
  linkSettings: LinkSettings,
) {
  const config = {
    devices: {
      samplerate: 48000,
      capture_samplerate: 48000,
      chunksize: 64,
      capture: {
        type: 'Alsa',
        device: 'plughw:CARD=UMC1820',
        channels: 8,
        format: 'S24LE',
      },
      playback: {
        type: 'Alsa',
        device: 'plughw:CARD=UMC1820',
        channels: 10,
        format: 'S24LE',
      },
    },
    filters: {} as Record<string, any>,
    mixers: {
      input_to_channels: {
        channels: {
          in: 8,
          out: 10,
        },
        mapping: channels.map((c, index) => ({
          dest: index,
          sources: c.sources.map((source) => ({
            channel: source,
          })),
        })),
      },
    },
    pipeline: [
      {
        type: 'Mixer',
        name: 'input_to_channels',
      },
    ],
  };

  channels = resolveLinks(channels, linkSettings);

  channels.forEach((channel, index) => {
    // Only include channels that have sources (implicit activation)
    if (channel.sources && channel.sources.length > 0) {
      const channelConfig = createChannelConfig(index, channel);

      channelConfig.filters.forEach((filter) => {
        config.filters[filter.name] = filter.config;
      });
      config.pipeline.push(...channelConfig.pipelines);
    }
  });

  return config;
}

export function sendConfig(config: Record<string, any>) {
  console.log(config);
  send({ SetConfig: JSON.stringify(config) });
}

export function saveConfig() {
  return send({ WriteConfigFile: '/media/mmcblk0p2/camillaconfig-full.yaml' });
}
