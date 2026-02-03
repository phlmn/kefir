import { cn } from '@/lib/utils';
import { ChannelSettings as ChannelSettingsType } from '@/config';
import { DbMeter } from '@/components/DbMeter';

export function ChannelsStatus({
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {channelSettings.map((settings, index) => {
        // Skip rendering if settings is undefined
        if (!settings) {
          return (
            <div key={index} className="border-2 rounded-lg p-4">
              <div className="text-center">
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
            className={cn('border bg-gray-300/5 rounded-lg p-4 flex hover:bg-gray-300/10 duration-75')}
            onClick={() => onChannelClick(index)}
          >
            <div className={cn('grow', isActive ? '' : 'opacity-30')}>
              <h4 className="font-medium truncate" title={settings.name}>
                {settings.name}
              </h4>
              <div className="text-xs mb-2 text-muted-foreground font-mono">
                Channel {String(index + 1).padStart(2, '0')}
              </div>

              <div className="text-xs space-y-0.5 text-muted-foreground">
                <div>
                  Status:{' '}
                  <span className={cn('font-medium')}>
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
  );
}
