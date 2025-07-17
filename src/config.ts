import { send } from './ws';

export type SpeakerParams = {
  firTaps: number[];
  limiterThreshold: number;
  limiterRmsSamples: number;
  limiterDecay: number;
};

export type ChannelSettings = {
  delayInMs: number;
  source: number;
  gain: number;
  inverted: boolean;
  limiter: {
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
    source: settings.source,
    gain: settings.gain,
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
        channels: 2,
        format: 'S24LE',
      },
      playback: {
        type: 'Alsa',
        device: 'plughw:CARD=UMC1820',
        channels: 6,
        format: 'S24LE',
      },
    },
    filters: {} as Record<string, any>,
    mixers: {
      input_to_channels: {
        channels: {
          in: 2,
          out: 6,
        },
        mapping: channels.map((c, index) => ({
          dest: index,
          sources: [
            {
              channel: c.source,
              gain: c.gain,
              inverted: c.inverted,
            },
          ],
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
    const channelConfig = createChannelConfig(index, channel);

    channelConfig.filters.forEach((filter) => {
      config.filters[filter.name] = filter.config;
    });
    config.pipeline.push(...channelConfig.pipelines);
  });

  return config;
}

export function sendConfig(config: Record<string, any>) {
  send({ SetConfig: JSON.stringify(config) });
}

export function saveConfig() {
  return send({ WriteConfigFile: 'camillaconfig-full.yaml' });
}
