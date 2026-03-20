import { FilterEditor } from '@/components/FilterEditor';
import { NumberInput } from '@/components/NumberInput';
import { RoundCheckbox } from '@/components/RoundCheckbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChannelSettings } from '@/config';
import { useGlobalState } from '@/state';
import { useState } from 'react';
import { useParams } from 'react-router';

export function OutputChannelPage() {
  const params = useParams();
  const channel = parseInt(params.channel || '1') - 1;
  const { channelSettings, setChannelSettings } = useGlobalState();
  const [selectedFilter, setSelectedFilter] = useState<number | null>(null);

  const settings = channelSettings[channel];

  const updateSettings = (updates: Partial<ChannelSettings>) => {
    const newChannelSettings = [...channelSettings];
    newChannelSettings[channel] = { ...settings, ...updates };
    setChannelSettings(newChannelSettings);
  };

  const updateLimiter = (updates: Partial<ChannelSettings['limiter']>) => {
    updateSettings({
      limiter: { ...settings.limiter, ...updates },
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>Inputs</CardHeader>
        <CardContent className="flex gap-8">
          <div className="space-y-1">
            {[...new Array(4)]
              .map((_, i) => i)
              .map((ch) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id={`checkbox-inputs-channel-${ch}`}
                    checked={settings.sources.includes(ch)}
                    onCheckedChange={(checked) =>
                      updateSettings({
                        sources: checked
                          ? [...settings.sources, ch]
                          : settings.sources.filter((a) => a !== ch),
                      })
                    }
                  />
                  <FieldLabel htmlFor={`checkbox-inputs-channel-${ch}`}>
                    Channel {ch + 1}
                  </FieldLabel>
                </Field>
              ))}
          </div>
          <div className="space-y-1">
            {[...new Array(4)]
              .map((_, i) => i + 4)
              .map((ch) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id={`checkbox-inputs-channel-${ch}`}
                    checked={settings.sources.includes(ch)}
                    onCheckedChange={(checked) =>
                      updateSettings({
                        sources: checked
                          ? [...settings.sources, ch]
                          : settings.sources.filter((a) => a !== ch),
                      })
                    }
                  />
                  <FieldLabel htmlFor={`checkbox-inputs-channel-${ch}`}>
                    Channel {ch + 1}
                  </FieldLabel>
                </Field>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>IIR Filter</CardHeader>
        <CardContent>
          <FilterEditor
            filterDefs={settings.iirFilters}
            setFilterDefs={(filters) =>
              updateSettings({
                iirFilters: filters,
              })
            }
            selectedPoint={selectedFilter}
            onSelectedPointChange={setSelectedFilter}
          />
        </CardContent>
      </Card>

      <GeneralSettings settings={settings} onChange={updateSettings} />
      <LimiterSettings settings={settings.limiter} onChange={updateLimiter} />
    </div>
  );
}

function LimiterSettings({
  settings,
  onChange,
}: {
  settings: ChannelSettings['limiter'];
  onChange: (updates: Partial<ChannelSettings['limiter']>) => void;
}) {
  return (
    <Card>
      <CardHeader>Limiter</CardHeader>
      <CardContent>
        <Label>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => onChange({ enabled: checked })}
          />
          <span>Enabled</span>
        </Label>
        <Field>
          <FieldLabel>Limiter Threshold (db)</FieldLabel>
          <NumberInput
            value={settings.threshold}
            onChange={(value) => onChange({ threshold: value })}
            step={0.1}
            parseAs="float"
          />
        </Field>

        <Field>
          <FieldLabel>Limiter Decay (db/s)</FieldLabel>
          <NumberInput
            value={settings.decay}
            onChange={(value) => onChange({ decay: value })}
            step={0.1}
            parseAs="float"
          />
        </Field>

        <Field>
          <FieldLabel>Limiter RMS Samples</FieldLabel>
          <NumberInput
            value={settings.rmsSamples}
            onChange={(value) => onChange({ rmsSamples: value })}
            parseAs="int"
            min={1}
          />
        </Field>
      </CardContent>
    </Card>
  );
}

function GeneralSettings({
  settings,
  onChange,
}: {
  settings: ChannelSettings;
  onChange: (updates: Partial<ChannelSettings>) => void;
}) {
  return (
    <Card>
      <CardContent>
        <Field>
          <FieldLabel>Delay (ms)</FieldLabel>
          <NumberInput
            value={settings.delayInMs}
            onChange={(value) => onChange({ delayInMs: value })}
            step={0.1}
            parseAs="float"
            min={0}
          />
        </Field>
      </CardContent>
    </Card>
  );
}
