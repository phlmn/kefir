import React from 'react';
import { ChannelSettings as ChannelSettingsType } from './config';
import { CheckboxLabel } from './components/Label';
import { FormField } from './components/FormField';
import { NumberInput } from './components/NumberInput';
import { LimiterSettings } from './components/LimiterSettings';

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
      limiter: { ...settings.limiter, ...updates },
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <FormField label="Source">
            <NumberInput
              value={settings.source}
              onChange={(value) => updateSettings({ source: value })}
              parseAs="int"
              min={0}
            />
          </FormField>

          <FormField label="Gain (db)">
            <NumberInput
              value={settings.gain}
              onChange={(value) => updateSettings({ gain: value })}
              step={0.1}
              parseAs="float"
            />
          </FormField>

          <CheckboxLabel
            input={
              <input
                type="checkbox"
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={settings.inverted}
                onChange={(e) => updateSettings({ inverted: e.target.checked })}
              />
            }
          >
            Invert Polarity
          </CheckboxLabel>
        </div>

        {/* Delay Settings */}
        <div>
          <FormField label="Delay (ms)">
            <NumberInput
              value={settings.delayInMs}
              onChange={(value) => updateSettings({ delayInMs: value })}
              step={0.1}
              parseAs="float"
              min={0}
            />
          </FormField>
        </div>

        {/* Limiter Settings */}
        <LimiterSettings settings={settings.limiter} onChange={updateLimiter} />

        {/* Additional space for future settings */}
        <div>{/* Reserved for future settings */}</div>
      </div>
    </div>
  );
}
