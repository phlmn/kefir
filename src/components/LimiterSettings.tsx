import { FormField } from './FormField';
import { NumberInput } from './NumberInput';
import { ChannelSettings as ChannelSettingsType } from '../config';
import { Switch } from '@/components/ui/switch';

export interface LimiterSettingsProps {
  /**
   * Current limiter settings
   */
  settings: ChannelSettingsType['limiter'];

  /**
   * Callback when limiter settings change
   */
  onChange: (updates: Partial<ChannelSettingsType['limiter']>) => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function LimiterSettings({
  settings,
  onChange,
  className = '',
}: LimiterSettingsProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <label>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => onChange({ enabled: checked })}
        />{' '}
        Enabled
      </label>
      <FormField label="Limiter Threshold (db)">
        <NumberInput
          value={settings.threshold}
          onChange={(value) => onChange({ threshold: value })}
          step={0.1}
          parseAs="float"
        />
      </FormField>

      <FormField label="Limiter Decay (db/s)">
        <NumberInput
          value={settings.decay}
          onChange={(value) => onChange({ decay: value })}
          step={0.1}
          parseAs="float"
        />
      </FormField>

      <FormField label="Limiter RMS Samples">
        <NumberInput
          value={settings.rmsSamples}
          onChange={(value) => onChange({ rmsSamples: value })}
          parseAs="int"
          min={1}
        />
      </FormField>
    </div>
  );
}
