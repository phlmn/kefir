import { NumberInput } from '@/components/NumberInput';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChannelSettings } from '@/config';
import { useGlobalState } from '@/state';
import { useParams } from 'react-router';

export function OutputChannelPage() {
  const params = useParams();
  const channel = parseInt(params.channel || '1') - 1;
  const { channelSettings, setChannelSettings } = useGlobalState();

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

      <Card>
        <CardHeader>Lowpass</CardHeader>
        <CardContent>
          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select
              // value={settings.lowpass.type}
              // onChange={(value) => onChange({ lowpass: { ...settings.lowpass, type: value } })}
            >
              <SelectTrigger>
                <SelectValue>LR4</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Linkwitz–Riley</SelectLabel>
                  <SelectItem className='pl-6' value="lr2"><b>LR2</b> (12 dB/oct)</SelectItem>
                  <SelectItem className='pl-6' value="lr4"><b>LR4</b> (24 dB/oct)</SelectItem>
                  <SelectItem className='pl-6' value="lr6"><b>LR6</b> (36 dB/oct)</SelectItem>
                  <SelectItem className='pl-6' value="lr8"><b>LR8</b> (48 dB/oct)</SelectItem>2
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Butterworth</SelectLabel>
                  <SelectItem className='pl-6' value="b1"><b>B1</b> (6 dB/oct)</SelectItem>
                  <SelectItem className='pl-6' value="b2"><b>B2</b> (12 dB/oct)</SelectItem>
                  <SelectItem className='pl-6' value="b3"><b>B3</b> (18 dB/oct)</SelectItem>
                  <SelectItem className='pl-6' value="b4"><b>B4</b> (24 dB/oct)</SelectItem>
                  <SelectItem className='pl-6' value="b5"><b>B5</b> (30 dB/oct)</SelectItem>
                  <SelectItem className='pl-6' value="b6"><b>B6</b> (36 dB/oct)</SelectItem>
                  <SelectItem className='pl-6' value="b7"><b>B7</b> (42 dB/oct)</SelectItem>
                  <SelectItem className='pl-6' value="b8"><b>B8</b> (48 dB/oct)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Frequency (Hz)</FieldLabel>
            <NumberInput
              // value={settings.lowpass.frequency}
              // onChange={(value) => onChange({ lowpass: { ...settings.lowpass, frequency: value } })}
              min={0}
              max={20000}
              step={1}
            />
          </Field>

        </CardContent>
      </Card>
      <GeneralSettings settings={settings} onChange={updateSettings} />
      <LimiterSettings settings={settings.limiter} onChange={updateLimiter} />

      {/* Additional space for future settings */}
      <div>{/* Reserved for future settings */}</div>
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
