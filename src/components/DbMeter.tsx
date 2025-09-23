export function DbMeter({ value }: { value: number }) {
  const meterBg = `
    linear-gradient(to bottom,
    var(--color-red-500) 0%,
    var(--color-red-500) 12.5%,
    var(--color-green-500) 12.5%,
    var(--color-green-500) 100%)
  `;

  const dbToMeter = (db: number) => {
    // 0% => 10db
    // 12.5% => 0db
    // 25% => -10db
    // 50% => -30db
    // 75% => -50db
    // 100% => -70db

    const scale = -80;
    const offset = 10;

    const percent = (db - offset) / scale;

    if (percent > 0.95 && db > -80) {
      return 0.95;
    }

    return Math.min(1, Math.max(0, percent));
  };

  return (
    <div>
      <div className="w-3 h-full rounded-full relative overflow-hidden border-2 border-gray-200">
        <div className="w-full h-full absolute" style={{ background: meterBg }}>
          <div
            className="w-full top-0 bg-gray-200 absolute"
            style={{
              transition: '.1s all',
              height: `${(dbToMeter(value) * 100).toFixed(2)}%`,
            }}
          ></div>
          <div className="h-[1px] w-full top-[12.5%] bg-gray-400 absolute"></div>
        </div>
      </div>
    </div>
  );
}
