import { send } from './ws';

export type SpeakerParams = {
  firTaps: number[];
  limiterThreshold: number;
  limiterRmsSamples: number;
  limiterDecay: number;
};

export type ChannelSettings = {
  name: string;
  delayInMs: number;
  sources: {
    channel: number;
    gain: number;
  }[];
  inverted: boolean;
  limiter: {
    enabled: boolean;
    threshold: number;
    rmsSamples: number;
    decay: number;
  };
  firTaps: number[];
};

export type InputSettings = {
  gain: number;
};

function createChannelConfig(channel: number, settings: ChannelSettings) {
  const filters = [];

  const filterName = (name: string) => `ch${channel}_${name}`;

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

  if (settings.limiter.enabled) {
    filters.push({
      name: filterName('limiter'),
      config: {
        type: 'Limiter',
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
  filters.forEach((filter) => {
    pipelines.push({
      type: 'Filter',
      channel: channel,
      names: [filter.name],
    });
  });

  return {
    inverted: settings.inverted,
    filters: filters,
    pipelines: pipelines,
  };
}

export function buildConfig(
  inChannels: InputSettings[],
  channels: ChannelSettings[],
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
            ...source,
            inverted: c.inverted, // Apply channel-level inversion to all sources
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
  return send({ WriteConfigFile: 'camillaconfig-full.yaml' });
}
