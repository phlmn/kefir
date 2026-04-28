import { FilterEditor } from "@/components/FilterEditor";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useGlobalState } from "@/state";
import { useState } from "react";

export function HouseCurvePage() {
  const { setHouseFilters, houseFilters } = useGlobalState();
  const [selectedFilter, setSelectedFilter] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader className="flex-row justify-between">
        <CardTitle>
          House Curve
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FilterEditor
          filterDefs={houseFilters}
          setFilterDefs={(filters) => setHouseFilters(filters)}
          selectedPoint={selectedFilter}
          onSelectedPointChange={setSelectedFilter}
        />
      </CardContent>
    </Card>
  );
}
