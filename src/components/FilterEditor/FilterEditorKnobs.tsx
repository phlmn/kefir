import produce from 'immer';
import { Filter } from '.';
import { Field, FieldContent, FieldLabel } from '../ui/field';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { NumberInput } from '../NumberInput';
import { DbGainInput } from '../DbGainInput';

export function FilterEditorKnobs({
  filterDefs,
  selectedPoint,
  setFilterDefs,
}: {
  filterDefs: Filter[];
  selectedPoint: number | null;
  setFilterDefs: (newFilterDefs: Filter[]) => void;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Field>
          <FieldLabel>Enabled</FieldLabel>
          <FieldContent>
            <Switch
              disabled={selectedPoint == null}
              checked={
                selectedPoint != null
                  ? filterDefs[selectedPoint].enabled
                  : false
              }
              onCheckedChange={(checked) => {
                if (selectedPoint == null) {
                  return;
                }

                setFilterDefs(
                  produce(filterDefs, (draft) => {
                    draft[selectedPoint].enabled = checked;
                  }),
                );
              }}
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Type</FieldLabel>
          <FieldContent>
            <Select
              // className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
              disabled={selectedPoint == undefined}
              value={
                selectedPoint != null ? filterDefs[selectedPoint].type : ''
              }
              onValueChange={(value) => {
                if (selectedPoint == undefined) {
                  return;
                }

                setFilterDefs(
                  produce(filterDefs, (draft) => {
                    draft[selectedPoint].type = value as Filter['type'];
                  }),
                );
              }}
            >
              <SelectTrigger>
                <SelectValue>
                  {selectedPoint == undefined
                    ? ''
                    : filterDefs[selectedPoint].type}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {/*{selectedPoint == undefined && <SelectItem value=""></SelectItem>}*/}
                <SelectItem value="peak">Peak</SelectItem>
                <SelectItem value="highpass">Highpass</SelectItem>
                <SelectItem value="lowpass">Lowpass</SelectItem>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Frequency (Hz)</FieldLabel>
          <NumberInput
            disabled={
              selectedPoint == null ||
              filterDefs[selectedPoint].frequency == undefined
            }
            value={
              (selectedPoint != null && filterDefs[selectedPoint].frequency) ||
              0
            }
            onChange={(value) => {
              if (selectedPoint == undefined) {
                return;
              }

              setFilterDefs(
                produce(filterDefs, (draft) => {
                  draft[selectedPoint].frequency = value;
                }),
              );
            }}
            parseAs="float"
            min={1}
            max={24000}
          />
        </Field>
        <Field>
          <FieldLabel>Gain (dB)</FieldLabel>
          <DbGainInput
            onChange={(value) => {
              if (selectedPoint == undefined) {
                return;
              }

              setFilterDefs(
                produce(filterDefs, (draft) => {
                  draft[selectedPoint].gain = value;
                }),
              );
            }}
            value={
              (selectedPoint != null && filterDefs[selectedPoint].gain) || 0
            }
            disabled={
              selectedPoint == null ||
              filterDefs[selectedPoint].gain == undefined
            }
          />
        </Field>
        <Field>
          <FieldLabel>Q</FieldLabel>
          <NumberInput
            disabled={
              selectedPoint == null || filterDefs[selectedPoint].q == undefined
            }
            value={(selectedPoint != null && filterDefs[selectedPoint].q) || 0}
            onChange={(value) => {
              if (selectedPoint == undefined) {
                return;
              }

              setFilterDefs(
                produce(filterDefs, (draft) => {
                  draft[selectedPoint].q = value;
                }),
              );
            }}
            step={0.1}
            parseAs="float"
            min={0.1}
            max={24}
          />
        </Field>
      </div>
    </div>
  );
}
