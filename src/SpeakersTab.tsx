import { cn } from './components/utils';
import { Card } from './components/Card';
import { Button } from './components/Button';
import {
  ChevronDownIcon,
  Edit,
  Plus,
  RefreshCcw,
  RefreshCw,
  Save,
  Trash2,
  WifiSync,
} from 'lucide-react';
import { useLocalStorage } from './useLocalStorage';
import { useState } from 'react';
import { Select } from '@headlessui/react';
import { Label } from './components/Label';
import { Filter, FilterEditor } from './FilterEditor';

type SpeakerPreset = {
  name: string;
  filter: Filter[];
};

type Speaker = {
  name: string;
  channel: number;

  preset: SpeakerPreset;
  presetEdited: boolean;
};

export function SpeakersTab() {
  const [speakers, setSpeakers] = useLocalStorage<Speaker[]>('speakers', []);
  const [speakerPresets, setSpeakerPresets] = useLocalStorage<SpeakerPreset[]>(
    'speakerPresets',
    [{ name: 'Default Preset', filter: [] }],
  );
  const [selectedSpeaker, setSelectedSpeaker] = useState<number | null>(null);

  return (
    <>
      <Card className="mb-4">
        <div className="flex mb-4">
          <div className="ml-auto">
            <Button
              size="sm"
              onClick={() =>
                setSpeakers([
                  ...speakers,
                  {
                    name: 'New Speaker',
                    channel: 1,
                    preset: speakerPresets[0],
                    presetEdited: false,
                  },
                ])
              }
            >
              <Plus className="h-4 w-4" />
              Add Loudspeaker
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {speakers.map((s, i) => {
            return (
              <Speaker
                key={i}
                speaker={s}
                onClick={() => setSelectedSpeaker(i)}
                onRemove={() => {
                  if (confirm('Remove this Loudspeaker?')) {
                    setSpeakers(
                      speakers.filter((_, removeIndex) => removeIndex !== i),
                    );
                  }
                }}
              />
            );
          })}
        </div>
      </Card>
      {selectedSpeaker !== null && speakers[selectedSpeaker] && (
        <SpeakerSettings speaker={speakers[selectedSpeaker]} />
      )}
    </>
  );
}

function Speaker({
  speaker,
  onRemove,
  onClick,
}: {
  speaker: Speaker;
  onRemove: () => void;
  onClick: () => void;
}) {
  const isActive = false;

  return (
    <div
      className={cn(
        'border-2 rounded-lg p-4 transition-all hover:scale-[102%] min-h-40 relative',
        isActive
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 bg-gray-50',
      )}
      onClick={onClick}
    >
      <Button
        size="icon"
        className="absolute right-1 top-1"
        variant="transparent"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <h4 className="font-medium text-gray-900 truncate" title={speaker.name}>
        {speaker.name}
      </h4>
      <div className="text-sm text-gray-600 space-y-1">
        <div className="text-xs text-gray-500">{speaker.preset.name}</div>
        <div className="text-xs text-gray-500">Channel {speaker.channel}</div>
      </div>{' '}
    </div>
  );
}

function SpeakerSettings({ speaker }: { speaker: Speaker }) {
  return (
    <Card>
      <Label inline>
        Name:
        <input
          type="text"
          value={speaker.name}
          // onChange={(e) => updateChannelName(channelIndex, e.target.value)}
          className="ml-1 w-60 px-2.5 py-1 text-sm border border-gray-300 hover:border-gray-400 rounded focus:bg-white focus:ring-blue-500 focus:border-blue-500"
          // placeholder={`Channel ${channelIndex + 1}`}
        />
      </Label>
      <Label inline className="ml-4">
        Channel:
        <div className="relative ml-1">
          <Select
            className={cn(
              'block w-full appearance-none rounded-lg border-none bg-gray-200 px-3 py-1.5 pr-8 text-sm/6',
              'focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/25',
              // Make the text of each option black on Windows
              '*:text-black',
            )}
          >
            <option value="active">A</option>
            <option value="paused">B</option>
            <option value="delayed">C</option>
            <option value="canceled">D</option>
          </Select>
          <ChevronDownIcon
            className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60"
            aria-hidden="true"
          />
        </div>
      </Label>
      <hr className="my-4 border-gray-300" />
      <div className="flex">
        <Label inline>
          Preset:
          <div className="relative ml-1">
            <Select
              className={cn(
                'block w-full appearance-none rounded-lg border-none bg-gray-200 px-3 py-1.5 pr-8 text-sm/6',
                'focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/25',
                // Make the text of each option black on Windows
                '*:text-black',
              )}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="delayed">Delayed</option>
              <option value="canceled">Canceleleleleleled</option>
            </Select>
            <ChevronDownIcon
              className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60"
              aria-hidden="true"
            />
          </div>
        </Label>
        <div className="ml-auto">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (confirm('Update Preset?')) {
                // TODO: Implement update preset logic
              }
            }}
          >
            <RefreshCw className="h-4 w-4" /> Update Preset
          </Button>
        </div>
      </div>
      <FilterEditor
        filterDefs={speaker.preset.filter}
        setFilterDefs={() => {}}
        // computedGain={computedFilter?.gain}
        // computedPhase={computedFilter?.phase}
      />
    </Card>
  );
}
