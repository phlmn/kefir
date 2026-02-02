import { Card } from "@/components/Card";
import { DbMeter } from "@/components/DbMeter";
import { cn } from "@/lib/utils";
import { useGlobalState } from "@/state";

export function InputsPage() {
  const { captureSignalsPeak, captureSignalsRms } = useGlobalState();

  return (
    <>
      <ChannelsStatus
        captureSignalsRms={captureSignalsRms}
        captureSignalsPeak={captureSignalsPeak}
      />
    </>
  );
}

function ChannelsStatus({
  captureSignalsRms,
  captureSignalsPeak,
}: {
  captureSignalsRms: number[];
  captureSignalsPeak: number[];
}) {
  return (
    <Card>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...new Array(8).fill(0)].map((_, index) => {
          const isActive = true;

          return (
            <div
              key={index}
              className={cn(
                'border-2 rounded-lg p-4 transition-all hover:scale-[102%] flex min-h-40',
                isActive
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-gray-50',
              )}
            >
              <div className="grow">
                <h4
                  className="font-medium text-gray-900 truncate"
                  title={`Channel ${index + 1}`}
                >
                  Channel {index + 1}
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
                </div>
              </div>
              <DbMeter value={(captureSignalsPeak[index] || -120) + 6} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
