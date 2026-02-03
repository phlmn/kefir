import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChannelsStatus } from './OutputsPanel';
import { useGlobalState } from '@/state';
import { InputsStatus } from './InputsStatus';

export function HomePage() {
  return (
    <>
      <InputsCard />
      <OutputsCard />
    </>
  );
}

function OutputsCard() {
  const { channelSettings, playbackSignalsRms, playbackSignalsPeak } =
    useGlobalState();

  return (
    <Card className='mb-5'>
      <CardHeader>
        <CardTitle>Outputs</CardTitle>
      </CardHeader>
      <CardContent>
        <ChannelsStatus
          channelSettings={channelSettings}
          playbackSignalsPeak={playbackSignalsPeak}
          playbackSignalsRms={playbackSignalsRms}
          onChannelClick={() => {}}
        />
      </CardContent>
    </Card>
  );
}

function InputsCard() {
  const { captureSignalsPeak, captureSignalsRms } = useGlobalState();

  return (
    <Card className='mb-5'>
      <CardHeader>
        <CardTitle>Inputs</CardTitle>
      </CardHeader>
      <CardContent>
        <InputsStatus
          captureSignalsPeak={captureSignalsPeak}
          captureSignalsRms={captureSignalsRms}
        />
      </CardContent>
    </Card>
  );
}
