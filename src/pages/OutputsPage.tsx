import { useState } from 'react';

import { ChannelSettings } from '@/ChannelSettings';
import { cn } from '@/lib/utils';
import { ChannelSettings as ChannelSettingsType } from '@/config';
import { Card } from '@/components/Card';
import { DbMeter } from '@/components/DbMeter';
import { useGlobalState } from '@/state';

export function OutputsPage() {
  const {
    channelSettings,
    setChannelSettings,
    playbackSignalsRms,
    playbackSignalsPeak,
  } = useGlobalState();
  const [editChannel, setEditChannel] = useState<number | null>(null);

  return (
    <>
      <ChannelsStatus
        channelSettings={channelSettings}
        onChannelClick={(ch) => setEditChannel(ch)}
        playbackSignalsRms={playbackSignalsRms}
        playbackSignalsPeak={playbackSignalsPeak}
      />
      <div className="h-6" />
      {editChannel !== null && (
        <ChannelSettings
          settings={channelSettings[editChannel]}
          onChange={(settings) => {
            const newChannelSettings = [...channelSettings];
            newChannelSettings[editChannel] = settings;
            setChannelSettings(newChannelSettings);
          }}
          onClose={() => setEditChannel(null)}
        />
      )}
    </>
  );
}

function ChannelsStatus({
  channelSettings,
  onChannelClick,
  playbackSignalsRms,
  playbackSignalsPeak,
}: {
  channelSettings: ChannelSettingsType[];
  onChannelClick: (ch: number) => void;
  playbackSignalsRms: number[];
  playbackSignalsPeak: number[];
}) {
  return (
    <Card>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {channelSettings.map((settings, index) => {
          // Skip rendering if settings is undefined
          if (!settings) {
            return (
              <div
                key={index}
                className="border-2 rounded-lg p-4 border-gray-300 bg-gray-50"
              >
                <div className="text-center text-gray-500">
                  <div>Channel {index + 1}</div>
                  <div className="text-sm">Loading...</div>
                </div>
              </div>
            );
          }

          const isActive = settings.sources && settings.sources.length > 0;

          return (
            <div
              key={index}
              className={cn(
                'border-2 rounded-lg p-4 transition-all hover:scale-[102%] flex',
                isActive
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-gray-50',
              )}
              onClick={() => onChannelClick(index)}
            >
              <div className="grow">
                <h4
                  className="font-medium text-gray-900 truncate"
                  title={settings.name}
                >
                  {settings.name}
                </h4>

                <div className="text-sm text-gray-600 space-y-1">
                  <div className="text-xs text-gray-500">
                    Channel {index + 1}
                  </div>
                  <div>
                    Status:{' '}
                    <span
                      className={cn(
                        'font-medium',
                        isActive ? 'text-green-700' : 'text-gray-500',
                      )}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    Inputs:{' '}
                    {settings.sources.length === 0
                      ? 'None'
                      : settings.sources.map((s) => s.channel + 1).join(', ')}
                  </div>
                  <div>Delay: {settings.delayInMs.toFixed(1)} ms</div>
                  {settings.inverted && (
                    <div className="text-orange-600">Inverted</div>
                  )}
                </div>
              </div>
              <DbMeter value={playbackSignalsPeak[index] || -120} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
