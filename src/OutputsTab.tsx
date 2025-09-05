import { ChannelSettings } from './ChannelSettings';
import { cn } from './components/utils';
import { ChannelSettings as ChannelSettingsType } from './config';
import { useState } from 'react';
import { Card } from './components/Card';

export function OutputsTab({
  channelSettings,
  setChannelSettings,
}: {
  channelSettings: ChannelSettingsType[];
  setChannelSettings: (settings: ChannelSettingsType[]) => void;
}) {
  const [editChannel, setEditChannel] = useState<number | null>(null);

  return (
    <>
      {editChannel == null ? (
        <ChannelStatus channelSettings={channelSettings} onChannelClick={(ch) => setEditChannel(ch)} />
      ) : (
        <ChannelSettings
          settings={channelSettings[editChannel]}
          onChange={(settings) => {
            const newChannelSettings = [...channelSettings];
            newChannelSettings[editChannel] = settings;
            setChannelSettings(newChannelSettings);
          }}
        />
      )}
    </>
  );
}

function ChannelStatus({
  channelSettings,
  onChannelClick,
}: {
  channelSettings: ChannelSettingsType[];
  onChannelClick: (ch: number) => void;
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
                'border-2 rounded-lg p-4 transition-all hover:scale-[102%]',
                isActive
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-gray-50',
              )}
              onClick={() => onChannelClick(index)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4
                  className="font-medium text-gray-900 truncate"
                  title={settings.name}
                >
                  {settings.name}
                </h4>
                <div
                  className={cn(
                    'w-3 h-3 rounded-full flex-shrink-0 ml-2',
                    isActive ? 'bg-green-500' : 'bg-gray-400',
                  )}
                />
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <div className="text-xs text-gray-500">Channel {index + 1}</div>
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
          );
        })}
      </div>
    </Card>
  );
}
