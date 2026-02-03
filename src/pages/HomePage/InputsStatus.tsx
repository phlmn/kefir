import { DbMeter } from '@/components/DbMeter';
import { cn } from '@/lib/utils';

export function InputsStatus({
  captureSignalsRms,
  captureSignalsPeak,
}: {
  captureSignalsRms: number[];
  captureSignalsPeak: number[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-8 gap-4">
      {[...new Array(8).fill(0)].map((_, index) => {
        const muted = index > 3;

        return (
          <div
            key={index}
            className={cn(
              'border bg-gray-300/5 rounded-lg p-3 transition-all flex min-h-20',
              'hover:bg-gray-300/10 duration-75',
              muted && 'border-red-600/50 bg-red-600/5 hover:bg-red-600/10',
            )}
          >
            <div className="grow">
              <h4
                className="font-medium truncate"
                title={`Channel ${index + 1}`}
              >
                Ch {String(index + 1).padStart(2, '0')}
              </h4>
              <div className="text-xs mb-2 text-muted-foreground font-mono">
                Channel {String(index + 1).padStart(2, '0')}
              </div>

              <div className="text-xs space-y-0.5">
                <div>
                  <span
                    className={cn(
                      'font-medium',
                      'text-muted-foreground',
                      muted ? 'text-red-700' : '',
                    )}
                  >
                    {muted ? 'Muted' : 'Enabled'}
                  </span>
                </div>
              </div>
            </div>
            <DbMeter value={(captureSignalsPeak[index] || -120) + 6} />
          </div>
        );
      })}
    </div>
  );
}
