import { ChannelSettings as ChannelSettingsType } from './config';
import { FormField } from './components/FormField';
import { NumberInput } from './components/NumberInput';
import { LimiterSettings } from './components/LimiterSettings';
import { Modal } from './components/Modal';

interface ChannelSettingsProps {
  settings: ChannelSettingsType;
  onChange: (settings: ChannelSettingsType) => void;
  onClose: () => void;
}

export function ChannelSettings({
  settings,
  onChange,
  onClose,
}: ChannelSettingsProps) {
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
    <Modal onClose={onClose} open={true}>
      <div className="flex gap-8">
        {/* Input Sources Info */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">{settings.name}</h4>
            {settings.sources && settings.sources.length > 0 ? (
              <div className="space-y-2">
                {settings.sources.map((source, index) => (
                  <div key={index} className="text-sm text-blue-800">
                    Input {source.channel + 1}: {source.gain.toFixed(1)} dB
                  </div>
                ))}
                {settings.inverted && (
                  <div className="text-sm text-orange-700 font-medium">
                    Channel Inverted
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-blue-700">No inputs connected</div>
            )}
            <div className="text-xs text-blue-600 mt-2">
              Use the Routing tab to configure input sources
            </div>
          </div>
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
    </Modal>
  );
}
