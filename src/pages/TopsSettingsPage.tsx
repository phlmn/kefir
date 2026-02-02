import { FilterEditor } from '@/components/FilterEditor';
import { useGlobalState } from '@/state';

export function TopsSettingsPage() {
  const { topsFilters, setTopsFilters, computedFilterTops } = useGlobalState();

  return (
    <FilterEditor
      filterDefs={topsFilters}
      setFilterDefs={setTopsFilters}
      computedGain={computedFilterTops?.gain}
      computedPhase={computedFilterTops?.phase}
    />
  );
}
