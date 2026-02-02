import { FilterEditor } from '@/components/FilterEditor';
import { useGlobalState } from '@/state';

export function BassSettingsPage() {
  const { setBassFilters, bassFilters, computedFilterBass } = useGlobalState();

  return (
    <FilterEditor
      filterDefs={bassFilters}
      setFilterDefs={setBassFilters}
      computedGain={computedFilterBass?.gain}
      computedPhase={computedFilterBass?.phase}
    />
  );
}
