import { FilterEditor } from '@/components/FilterEditor';
import { NumberInput } from '@/components/NumberInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
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
    <div className="space-y-5 pb-5">
      <div className="flex gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-8">
            <div className="space-y-2">
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
            <div className="space-y-2">
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

        <GeneralSettings settings={settings} onChange={updateSettings} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>IIR Filter</CardTitle>
        </CardHeader>
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
      <CardHeader>
        <CardTitle>Limiter</CardTitle>
      </CardHeader>
      <CardContent>
        <Label>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => onChange({ enabled: checked })}
          />
          <span>Enabled</span>
        </Label>
        <Field>
          <FieldLabel>Limiter Threshold (dB)</FieldLabel>
          <NumberInput
            value={settings.threshold}
            onChange={(value) => onChange({ threshold: value })}
            step={0.1}
            parseAs="float"
          />
        </Field>

        <Field>
          <FieldLabel>Limiter Decay (dB/s)</FieldLabel>
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
    <Card className="pt-8">
      <CardContent className="space-y-4">
        <Field orientation="horizontal">
          <FieldLabel className="w-32">Invert Polarity</FieldLabel>
          <Switch
            checked={settings.inverted}
            onCheckedChange={(checked) =>
              onChange({ ...settings, inverted: checked })
            }
          />
        </Field>
        <Field orientation="horizontal">
          <FieldLabel className="w-32">Gain (dB)</FieldLabel>
          <NumberInput
            value={settings.gain}
            onChange={(value) => onChange({ gain: value })}
            step={0.1}
            parseAs="float"
            min={0}
            className="w-24"
          />
        </Field>
        <Field orientation="horizontal">
          <FieldLabel className="w-32">Delay (ms)</FieldLabel>
          <NumberInput
            value={settings.delayInMs}
            onChange={(value) => onChange({ delayInMs: value })}
            step={0.1}
            parseAs="float"
            min={0}
            className="w-24"
          />
        </Field>
      </CardContent>
    </Card>
  );
}
