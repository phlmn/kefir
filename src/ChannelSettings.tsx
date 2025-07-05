import React, { useState } from 'react';
import { ChannelSettings as ChannelSettingsType } from './config';

interface ChannelSettingsProps {
  settings: ChannelSettingsType;
  onChange: (settings: ChannelSettingsType) => void;
}

export function ChannelSettings({ settings, onChange }: ChannelSettingsProps) {
  const updateSettings = (updates: Partial<ChannelSettingsType>) => {
    onChange({ ...settings, ...updates });
  };

  const updateLimiter = (updates: Partial<ChannelSettingsType['limiter']>) => {
    onChange({
      ...settings,
      limiter: { ...settings.limiter, ...updates }
    });
  };

  return (
    <div className="container">
      <div className="row">
        <div className="column">
          <label>Source</label>
          <input
            type="number"
            value={settings.source}
            onChange={(e) => updateSettings({ source: parseInt(e.target.value) || 0 })}
          />
          <label>Gain (db)</label>
          <input
            type="number"
            step="0.1"
            value={settings.gain}
            onChange={(e) => updateSettings({ gain: parseFloat(e.target.value) || 0 })}
          />
          <label>
            <input
              type="checkbox"
              checked={settings.inverted}
              onChange={(e) => updateSettings({ inverted: e.target.checked })}
            />
            Invert Polarity
          </label>
        </div>
        <div className="column">
          <label>Delay (ms)</label>
          <input
            type="number"
            step="0.1"
            value={settings.delayInMs}
            onChange={(e) => updateSettings({ delayInMs: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="column">
          <label>Limiter Threshold (db)</label>
          <input
            type="number"
            step="0.1"
            value={settings.limiter.threshold}
            onChange={(e) => updateLimiter({ threshold: parseFloat(e.target.value) || 0 })}
          />
          <label>Limiter Decay (db/s)</label>
          <input
            type="number"
            step="0.1"
            value={settings.limiter.decay}
            onChange={(e) => updateLimiter({ decay: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="column">
          <label>Limiter RMS Samples</label>
          <input
            type="number"
            value={settings.limiter.rmsSamples}
            onChange={(e) => updateLimiter({ rmsSamples: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>
    </div>
  );
}
