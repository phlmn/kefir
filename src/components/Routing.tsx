import { ChannelSettings as ChannelSettingsType } from '../config';
import { DbGainInput } from './DbGainInput';
import { RoundCheckbox } from './RoundCheckbox';
import { Card } from './ui/card';
import { Switch } from './ui/switch';

interface RoutingProps {
  channelSettings: ChannelSettingsType[];
  onChannelSettingsChange: (settings: ChannelSettingsType[]) => void;
}

interface RoutingMatrixProps {
  channelSettings: ChannelSettingsType[];
  onChannelSettingsChange: (settings: ChannelSettingsType[]) => void;
}

function RoutingMatrix({
  channelSettings,
  onChannelSettingsChange,
}: RoutingMatrixProps) {
  const inputCount = 8;
  const outputCount = 10;

  const toggleChannelSource = (channelIndex: number, inputIndex: number) => {
    const newSettings = [...channelSettings];
    const currentSources = newSettings[channelIndex].sources;

    // Check if this input is already connected
    const existingSourceIndex = currentSources.findIndex(
      (s) => s.channel === inputIndex,
    );

    if (existingSourceIndex >= 0) {
      // Remove the source
      newSettings[channelIndex] = {
        ...newSettings[channelIndex],
        sources: currentSources.filter((s) => s.channel !== inputIndex),
      };
    } else {
      // Add the source
      newSettings[channelIndex] = {
        ...newSettings[channelIndex],
        sources: [
          ...currentSources,
          {
            channel: inputIndex,
            gain: 0,
          },
        ],
      };
    }

    onChannelSettingsChange(newSettings);
  };

  const updateSourceGain = (
    channelIndex: number,
    inputIndex: number,
    gain: number,
  ) => {
    const newSettings = [...channelSettings];
    const currentSources = newSettings[channelIndex].sources;
    const sourceIndex = currentSources.findIndex(
      (s) => s.channel === inputIndex,
    );

    if (sourceIndex >= 0) {
      const updatedSources = [...currentSources];
      updatedSources[sourceIndex] = { ...updatedSources[sourceIndex], gain };

      newSettings[channelIndex] = {
        ...newSettings[channelIndex],
        sources: updatedSources,
      };

      onChannelSettingsChange(newSettings);
    }
  };

  const toggleChannelInversion = (channelIndex: number) => {
    const newSettings = [...channelSettings];
    newSettings[channelIndex] = {
      ...newSettings[channelIndex],
      inverted: !newSettings[channelIndex].inverted,
    };
    onChannelSettingsChange(newSettings);
  };

  const updateChannelName = (channelIndex: number, name: string) => {
    const newSettings = [...channelSettings];
    newSettings[channelIndex] = {
      ...newSettings[channelIndex],
      name: name,
    };
    onChannelSettingsChange(newSettings);
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Input to Channel Routing Matrix
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Route any of 8 inputs to each of the 10 output channels. Each input
        connection has individual gain control, and channels have master
        inversion.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr>
              <th className="text-left p-1 text-xs font-medium text-gray-700 min-w-[60px]">
                Ch
              </th>
              <th className="text-left p-1 text-xs font-medium text-gray-700 min-w-[120px]">
                Name
              </th>
              {Array.from({ length: inputCount }, (_, i) => (
                <th
                  key={i}
                  className="text-center p-1 text-xs font-medium text-gray-700 min-w-[40px]"
                >
                  In{i + 1}
                </th>
              ))}
              <th className="text-left p-1 text-xs font-medium text-gray-700 min-w-[190px]">
                Source Controls
              </th>
              <th className="text-center p-1 text-xs font-medium text-gray-700 min-w-[60px]">
                Inv
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: outputCount }, (_, channelIndex) => {
              const settings = channelSettings[channelIndex];

              // Skip rendering this row if settings is undefined
              if (!settings) {
                return (
                  <tr key={channelIndex} className="border-t border-gray-200">
                    <td
                      colSpan={inputCount + 4}
                      className="p-1 text-center text-gray-500 text-xs"
                    >
                      Channel {channelIndex + 1} - Loading...
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={channelIndex}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-1 font-medium text-gray-900 text-sm text-center">
                    {channelIndex + 1}
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) =>
                        updateChannelName(channelIndex, e.target.value)
                      }
                      className="w-full px-2.5 py-1 text-sm border border-gray-300 hover:border-gray-400 rounded focus:bg-white focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Channel ${channelIndex + 1}`}
                    />
                  </td>
                  {Array.from({ length: inputCount }, (_, inputIndex) => {
                    const isConnected = settings.sources.some(
                      (s) => s.channel === inputIndex,
                    );
                    return (
                      <td key={inputIndex} className="p-1 text-center">
                        <RoundCheckbox
                          checked={isConnected}
                          onChange={() =>
                            toggleChannelSource(channelIndex, inputIndex)
                          }
                          title={`Toggle Input ${inputIndex + 1} to Channel ${
                            channelIndex + 1
                          }`}
                        />
                      </td>
                    );
                  })}
                  <td className="p-1">
                    <div className="space-y-1">
                      {settings.sources.map((source, sourceIndex) => (
                        <div
                          key={sourceIndex}
                          className="flex items-center gap-1 text-xs"
                        >
                          <span className="w-8 text-gray-600 flex-shrink-0">
                            In{source.channel + 1}:
                          </span>
                          <DbGainInput
                            value={source.gain}
                            onChange={(value) =>
                              updateSourceGain(
                                channelIndex,
                                source.channel,
                                value,
                              )
                            }
                            min={-60}
                            max={40}
                            className="w-full"
                            withSlider
                          />
                        </div>
                      ))}
                      {settings.sources.length === 0 && (
                        <div className="text-xs text-gray-400">No inputs</div>
                      )}
                    </div>
                  </td>
                  <td className="p-1 text-center">
                    <Switch
                      checked={settings.inverted}
                      onCheckedChange={() =>
                        toggleChannelInversion(channelIndex)
                      }
                      title={`Invert Channel ${channelIndex + 1}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function Routing({
  channelSettings,
  onChannelSettingsChange,
}: RoutingProps) {
  return (
    <div>
      <RoutingMatrix
        channelSettings={channelSettings}
        onChannelSettingsChange={onChannelSettingsChange}
      />
    </div>
  );
}
