import { FilterEditor } from "@/components/FilterEditor";
import { useGlobalState } from "@/state";

export function HouseCurvePage() {
  const { setHouseFilters, houseFilters } = useGlobalState();

  return (
    <FilterEditor
      filterDefs={houseFilters}
      setFilterDefs={setHouseFilters}
    />
  );
}
