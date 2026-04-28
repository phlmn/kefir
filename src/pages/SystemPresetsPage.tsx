import { FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SystemPreset, useGlobalState } from '@/state';
import produce from 'immer';
import { useState } from 'react';

export function SystemPresetsPage() {
  const { systemPresets, setSystemPresets, channelSettings, setChannelSettings, linkSettings, setLinkSettings, houseFilters, setHouseFilters, currentSystemPreset, setCurrentSystemPreset } =
    useGlobalState();

  const [newPresetName, setNewPresetName] = useState('');

  const onCreateNewPreset = () => {
    if (newPresetName.length == 0) {
      alert("Preset name required!");
      return;
    }

    setSystemPresets([...systemPresets, {
      name: newPresetName,
      linkSettings,
      houseFilters,
      channelSettings,
    }])
  };

  const loadPreset = (preset: SystemPreset) => {
    if (!confirm(`Do you really want to load preset "${preset.name}" and overwrite all settings?`)) {
      return;
    }

    setCurrentSystemPreset(preset.name);
    setLinkSettings(preset.linkSettings);
    setChannelSettings(preset.channelSettings);
    setHouseFilters(preset.houseFilters);
  };

  const onUpdateCurrent = () => {
    if (!confirm(`Do you really want to overrite the preset "${currentSystemPreset}"?`)) {
      return;
    }

    const newPresets = produce(systemPresets, (draft) => {
      const preset = draft.find(p => p.name == currentSystemPreset);

      if (preset) {
        preset.channelSettings = channelSettings;
        preset.houseFilters = houseFilters;
        preset.linkSettings = linkSettings;
      }
    })

    setSystemPresets(newPresets);
  }

  return (
    <div className="space-y-5 pb-5">
      <Card>
        <CardHeader>
          <CardTitle>Current Preset</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Current Preset: {currentSystemPreset || "None"}</p>
          <div><Button disabled={currentSystemPreset == undefined} onClick={onUpdateCurrent}>Update Current</Button></div>
          <div>
            <FormField label='Name'>
                <Input value={newPresetName} onChange={(e) => setNewPresetName(e.currentTarget.value)}></Input>
              </FormField>
            <Button onClick={onCreateNewPreset}>Create New</Button></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>System Presets</CardTitle>
        </CardHeader>
        <CardContent>
          {systemPresets
            .toSorted((a, b) => a.name.localeCompare(b.name))
            .map((p) => {
              return <div className='py-1 hover:bg-neutral-200/5' onClick={() => loadPreset(p)}>{p.name}</div>;
            })}
          {systemPresets.length == 0 && <p>No Presets</p>}
        </CardContent>
      </Card>
    </div>
  );
}
