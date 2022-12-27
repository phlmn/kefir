import { send } from './ws';

export type SpeakerParams = {
  firTaps: number[];
  delay: number;
  limiterThreshold: number;
  limiterRmsSamples: number;
  limiterDecay: number;
  postGain: number;
  mute: boolean;
  invertPolarity: boolean;
};

export function sendConfig(
  topsParams: SpeakerParams,
  bassParams: SpeakerParams,
) {
  const cfg = `
devices:
  samplerate: 48000
  capture_samplerate: 48000
  chunksize: 64
  enable_rate_adjust: true
  enable_resampling: true
  resampler_type: BalancedAsync
  capture:
    type: Alsa
    device: "hw:CARD=CODEC"
    channels: 2
    format: S16LE
  playback:
    type: Alsa
    device: "hw:CARD=CODEC"
    channels: 2
    format: S16LE

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
  bass_post_gain:
    type: Gain
    parameters:
      gain: ${JSON.stringify(bassParams.postGain)}
      inverted: ${JSON.stringify(bassParams.invertPolarity)}
      mute: ${JSON.stringify(bassParams.mute)}
  bass_delay:
    type: Delay
    parameters:
      delay: ${JSON.stringify(bassParams.delay)}
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
  tops_post_gain:
    type: Gain
    parameters:
      gain: ${JSON.stringify(topsParams.postGain)}
      inverted: ${JSON.stringify(topsParams.invertPolarity)}
      mute: ${JSON.stringify(topsParams.mute)}
  tops_delay:
    type: Delay
    parameters:
      delay: ${JSON.stringify(topsParams.delay)}
      unit: ms
      subsample: false
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
      out: 3
    mapping:
      - dest: 0
        mute: false
        sources:
          - channel: 0
            gain: 0
            inverted: false
      - dest: 1
        mute: false
        sources:
          - channel: 1
            gain: 0
            inverted: false
      - dest: 2
        mute: false
        sources:
          - channel: 0
            gain: -6
            inverted: false
          - channel: 1
            gain: -6
            inverted: false
  btl_bass:
    channels:
      in: 3
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
          - channel: 2
            gain: 0
            inverted: false
      - dest: 3
        sources:
          - channel: 2
            gain: 0
            inverted: false

  to_2_ch:
    channels:
      in: 3
      out: 2
    mapping:
      - dest: 0
        sources:
          - channel: 0
            gain: 0
      - dest: 1
        sources:
          - channel: 1
            gain: 0

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
      - tops_post_gain
      - tops_limiter
      - tops_delay

  - type: Filter
    channel: 1
    names:
      - tops_fir
      - tops_post_gain
      - tops_limiter
      - tops_delay

  - type: Filter
    channel: 2
    names:
      - bass_fir
      - bass_post_gain
      - bass_limiter
      - bass_delay

  - type: Mixer
    name: to_2_ch
`;
  return send({ SetConfig: cfg });
}
