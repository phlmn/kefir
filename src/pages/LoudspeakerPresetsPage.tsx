import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ChannelSettings } from '@/config';
import { useGlobalState } from '@/state';
import { useState } from 'react';
import { useParams } from 'react-router';

export function LoudspeakerPresetsPage() {
  const params = useParams();
  const channel = parseInt(params.channel || '1') - 1;
  const {
    channelSettings,
    setChannelSettings,
    loudspeakerPresets,
    setLoudspeakerPresets,
  } = useGlobalState();

  const settings = channelSettings[channel];

  const updateSettings = (updates: Partial<ChannelSettings>) => {
    const newChannelSettings = [...channelSettings];
    newChannelSettings[channel] = { ...settings, ...updates };
    setChannelSettings(newChannelSettings);
  };

  return (
    <div className="space-y-5 pb-5">
      <Card>
        <CardHeader>
          <CardTitle>Loudspeaker Presets</CardTitle>
        </CardHeader>
        <CardContent>
          {loudspeakerPresets
            .toSorted((a, b) => a.name.localeCompare(b.name))
            .map((p) => {
              return <div className='space-y-1'>{p.name}</div>;
            })}
          {loudspeakerPresets.length == 0 && <p>No Presets</p>}
        </CardContent>
      </Card>
    </div>
  );
}
