import { Routing } from '@/components/Routing';
import { useGlobalState } from '@/state';

export function RoutingPage() {
  const { channelSettings, setChannelSettings } = useGlobalState();

  return (
    <Routing
      channelSettings={channelSettings}
      onChannelSettingsChange={setChannelSettings}
    />
  );
}
