import { FilterEditorChart } from './Chart';
import { FilterEditorKnobs } from './Knobs';
import { FilterDef } from '@/iirFilter';

export type SwitchableFilterDef = FilterDef & { enabled: boolean };

export function FilterEditor({
  filterDefs,
  setFilterDefs,
  computedGain,
  computedPhase,
  selectedPoint,
  onSelectedPointChange,
}: {
  filterDefs: SwitchableFilterDef[];
  setFilterDefs: (newFilterDefs: SwitchableFilterDef[]) => void;
  computedGain?: Array<{ x: number; y: number }>;
  computedPhase?: Array<{ x: number; y: number }>;
  selectedPoint: number | null;
  onSelectedPointChange: (point: number | null) => void;
}) {
  return (
    <div>
      <FilterEditorChart
        filterDefs={filterDefs}
        setFilterDefs={setFilterDefs}
        computedGain={computedGain}
        computedPhase={computedPhase}
        selectedPoint={selectedPoint}
        onSelectedPointChange={onSelectedPointChange}
      />
      <FilterEditorKnobs
        filterDefs={filterDefs}
        selectedPoint={selectedPoint}
        setFilterDefs={setFilterDefs}
      />
    </div>
  );
}
