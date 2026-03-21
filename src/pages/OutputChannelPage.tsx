import { FilterEditor } from '@/components/FilterEditor';
import { NumberInput } from '@/components/NumberInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ChannelSettings, hasLink, LinkSettings } from '@/config';
import { cn } from '@/lib/utils';
import { useGlobalState } from '@/state';
import produce from 'immer';
import { Link2Icon } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';

export function OutputChannelPage() {
  const params = useParams();
  const channel = parseInt(params.channel || '1') - 1;
  const { channelSettings, setChannelSettings, linkSettings, setLinkSettings } =
    useGlobalState();
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
          <CardContent className="flex pt-8">
            <Field>
              <FieldLabel>Channel Name</FieldLabel>
              <Input
                value={settings.name}
                onChange={(event) =>
                  updateSettings({ name: event.currentTarget.value })
                }
              />
            </Field>
          </CardContent>
        </Card>

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

        <GeneralSettings
          channel={channel}
          settings={settings}
          onChange={updateSettings}
        />
      </div>

      <Card>
        <CardHeader className="flex-row justify-between">
          <CardTitle>
            IIR Filter <LinkButton channel={channel} linkType="iirFilters" />
          </CardTitle>
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

      <LimiterSettings
        channel={channel}
        settings={settings.limiter}
        onChange={updateLimiter}
      />
    </div>
  );
}

function LimiterSettings({
  channel,
  settings,
  onChange,
}: {
  channel: number;
  settings: ChannelSettings['limiter'];
  onChange: (updates: Partial<ChannelSettings['limiter']>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Limiter <LinkButton channel={channel} linkType="limiter" />
        </CardTitle>
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
  channel,
  settings,
  onChange,
}: {
  channel: number;
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
          <FieldLabel className="w-32">
            Gain (dB) <LinkButton channel={channel} linkType="gain" />
          </FieldLabel>
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
          <FieldLabel className="w-32">
            Delay (ms) <LinkButton channel={channel} linkType="delay" />
          </FieldLabel>
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

function LinkButton({
  channel,
  linkType,
}: {
  channel: number;
  linkType: keyof LinkSettings;
}) {
  const { linkSettings, setLinkSettings } = useGlobalState();
  const isLinked = hasLink(linkSettings, channel, linkType);

  return (
    <Button
      title={isLinked ? 'Remove link' : 'Use values from neighbor channel'}
      size="iconSm"
      variant="ghost"
      className={cn('align-middle mb-0.5 ml-0.5', !isLinked && 'opacity-40')}
      onClick={() => {
        if (isLinked) {
          setLinkSettings(
            produce(linkSettings, (linkSettings) => {
              linkSettings[linkType] = linkSettings[linkType].filter(
                (l) => l.from !== channel && l.to !== channel,
              );
            }),
          );
        } else {
          setLinkSettings(
            produce(linkSettings, (linkSettings) => {
              linkSettings[linkType].push({
                from: channel % 2 == 0 ? channel + 1 : channel - 1,
                to: channel,
              });
            }),
          );
        }
      }}
    >
      <Link2Icon />
    </Button>
  );
}
