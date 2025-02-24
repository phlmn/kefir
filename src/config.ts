import { send } from './ws';

export type SpeakerParams = {
  firTaps: number[];
  limiterThreshold: number;
  limiterRmsSamples: number;
  limiterDecay: number;
};

export function sendConfig(
  topsParams: SpeakerParams,
  bassParams: SpeakerParams,
  delays: { ch1: number; ch2: number; ch3: number; ch4: number },
  invert: { ch1: boolean; ch2: boolean; ch3: boolean; ch4: boolean },
  gain: { ch1: number; ch2: number; ch3: number; ch4: number },
) {
  const cfg = `
devices:
  samplerate: 48000
  capture_samplerate: 48000
  chunksize: 64
#  enable_rate_adjust: true
#  enable_resampling: true
#  resampler_type: BalancedAsync
  capture:
    type: Alsa
    device: "plughw:CARD=UMC1820"
    channels: 2
    format: S24LE
  playback:
    type: Alsa
    device: "plughw:CARD=UMC1820"
    channels: 6
    format: S24LE

filters:
  overall_volume:
    type: Volume
    parameters:
      ramp_time: 200

  bass_fir:
    type: Conv
    parameters:
      values: ${JSON.stringify(bassParams.firTaps)}
      type: Values

  ch1_delay:
    type: Delay
    parameters:
      delay: ${JSON.stringify(delays.ch1)}
      unit: ms
      subsample: false
  ch2_delay:
    type: Delay
    parameters:
      delay: ${JSON.stringify(delays.ch2)}
      unit: ms
      subsample: false
  ch3_delay:
    type: Delay
    parameters:
      delay: ${JSON.stringify(delays.ch3)}
      unit: ms
      subsample: false
  ch4_delay:
    type: Delay
    parameters:
      delay: ${JSON.stringify(delays.ch4)}
      unit: ms
      subsample: false

  bass_limiter:
    type: Limiter
    parameters:
      threshold: ${JSON.stringify(bassParams.limiterThreshold)}
      rms_samples: ${JSON.stringify(bassParams.limiterRmsSamples)}
      decay: ${JSON.stringify(bassParams.limiterDecay)}

  tops_fir:
    type: Conv
    parameters:
      values: ${JSON.stringify(topsParams.firTaps)}
      type: Values

  tops_limiter:
    type: Limiter
    parameters:
      threshold: ${JSON.stringify(topsParams.limiterThreshold)}
      rms_samples: ${JSON.stringify(topsParams.limiterRmsSamples)}
      decay: ${JSON.stringify(topsParams.limiterDecay)}

mixers:
  to_2_1_channels:
    channels:
      in: 2
      out: 4
    mapping:
      - dest: 0
        sources:
          - channel: 0
            gain: 0
      - dest: 1
        sources:
          - channel: 1
            gain: 0
      - dest: 2
        sources:
          - channel: 0
            gain: -6
          - channel: 1
            gain: -6
      - dest: 3
        sources:
          - channel: 0
            gain: -6
          - channel: 1
            gain: -6

  3_ch_to_4_ch:
    channels:
      in: 4
      out: 5
    mapping:
      - dest: 0
        sources:
          - channel: 0
            gain: 0
      - dest: 1
        sources:
          - channel: 1
            gain: 0
      - dest: 2
        sources:
          - channel: 2
            gain: 0
      - dest: 3
        sources:
          - channel: 2
            gain: 0
      - dest: 4
        sources:
          - channel: 3
            gain: 0

  inverter:
    channels:
      in: 5
      out: 6
    mapping:
      - dest: 0
        sources:
          - channel: 0
            gain: ${JSON.stringify(gain.ch1)}
            inverted: ${JSON.stringify(invert.ch1)}
      - dest: 1
        sources:
          - channel: 1
            gain: ${JSON.stringify(gain.ch2)}
            inverted: ${JSON.stringify(invert.ch2)}
      - dest: 2
        sources:
          - channel: 2
            gain: ${JSON.stringify(gain.ch3)}
            inverted: ${JSON.stringify(invert.ch3)}
      - dest: 3
        sources:
          - channel: 3
            gain: ${JSON.stringify(gain.ch4)}
            inverted: ${JSON.stringify(invert.ch4)}
      - dest: 4
        sources:
          - channel: 4
      - dest: 5
        sources:
          - channel: 4

pipeline:
  - type: Filter
    channel: 0
    names:
      - overall_volume

  - type: Filter
    channel: 1
    names:
      - overall_volume

  - type: Mixer
    name: to_2_1_channels

  - type: Filter
    channel: 0
    names:
      - tops_fir

  - type: Filter
    channel: 1
    names:
      - tops_fir

  - type: Filter
    channel: 2
    names:
      - bass_fir

  - type: Mixer
    name: 3_ch_to_4_ch

  - type: Mixer
    name: inverter

  - type: Filter
    channel: 0
    names:
      - ch1_delay
      - tops_limiter

  - type: Filter
    channel: 1
    names:
      - ch2_delay
      - tops_limiter

  - type: Filter
    channel: 2
    names:
      - ch3_delay
      - bass_limiter

  - type: Filter
    channel: 3
    names:
      - ch4_delay
      - bass_limiter
`;
  return send({ SetConfig: cfg });
}

export function saveConfig() {
  return send({ WriteConfigFile: 'camillaconfig-full.yaml' });
}
