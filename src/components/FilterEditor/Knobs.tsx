import produce from 'immer';
import { Filter } from '.';
import { Field, FieldContent, FieldLabel } from '../ui/field';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
                <SelectValue/>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>General</SelectLabel>
                  <SelectItem className="pl-6" value="peak">Peak</SelectItem>
                  <SelectItem className="pl-6" value="allpass">Allpass</SelectItem>
                  <SelectItem className="pl-6" value="allpass2">Allpass 2</SelectItem>
                </SelectGroup>

                <SelectGroup>
                  <SelectLabel>Lowpass</SelectLabel>

                  <SelectItem className="pl-6" value="lpButterworth2">Butterworth 2 (12 db/oct)</SelectItem>
                  <SelectItem className="pl-6" value="lpButterworth4">Butterworth 4 (24 db/oct)</SelectItem>
                  <SelectItem className="pl-6" value="lpButterworth6">Butterworth 6 (36 db/oct)</SelectItem>
                  <SelectItem className="pl-6" value="lpButterworth8">Butterworth 8 (48 db/oct)</SelectItem>
                  <SelectItem className="pl-6" value="lpLinkwitzRiley2">Linkwitz-Riley 2 (12 db/oct)</SelectItem>
                  <SelectItem className="pl-6" value="lpLinkwitzRiley4">Linkwitz-Riley 4 (24 db/oct)</SelectItem>
                  <SelectItem className="pl-6" value="lpLinkwitzRiley8">Linkwitz-Riley 8 (48 db/oct)</SelectItem>
                </SelectGroup>

                <SelectGroup>
                  <SelectLabel>Highpass</SelectLabel>
                  <SelectItem className="pl-6" value="hpButterworth2">Butterworth 2 (12 db/oct)</SelectItem>
                  <SelectItem className="pl-6" value="hpButterworth4">Butterworth 4 (24 db/oct)</SelectItem>
                  <SelectItem className="pl-6" value="hpButterworth6">Butterworth 6 (36 db/oct)</SelectItem>
                  <SelectItem className="pl-6" value="hpButterworth8">Butterworth 8 (48 db/oct)</SelectItem>
                  <SelectItem className="pl-6" value="hpLinkwitzRiley2">Linkwitz-Riley 2 (12 db/oct)</SelectItem>
                  <SelectItem className="pl-6" value="hpLinkwitzRiley4">Linkwitz-Riley 4 (24 db/oct)</SelectItem>
                  <SelectItem className="pl-6" value="hpLinkwitzRiley8">Linkwitz-Riley 8 (48 db/oct)</SelectItem>
                </SelectGroup>
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
