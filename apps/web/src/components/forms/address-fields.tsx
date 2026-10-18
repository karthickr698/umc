import { Accordion } from '@/components/layout/accordion';
import { ADDRESS_FIELD_RULES, ADDRESS_FIELDS, type AddressField } from '@/lib/address-draft';
import type { BoundField } from '@/hooks/use-entity-form';
import { TextField } from './text-field';

export interface AddressFieldsProps {
  bind: (field: AddressField) => BoundField;
}

function AddressInput({ field, bind }: AddressFieldsProps & { field: AddressField }) {
  const { label, max } = ADDRESS_FIELD_RULES[field];
  return <TextField label={label} maxLength={max} placeholder="Optional" {...bind(field)} />;
}

/**
 * The optional parts of an `Address`, in a collapsible "Additional fields" section. It starts
 * open when an address is already filled in and stays open while a part has an error.
 */
export function AddressFields({ bind }: AddressFieldsProps) {
  const fields = ADDRESS_FIELDS.map((field) => bind(field));
  const hasValue = fields.some((field) => field.value.trim() !== '');
  const hasError = fields.some((field) => Boolean(field.error));

  return (
    <Accordion
      title="Additional fields"
      hint="Address (optional)"
      defaultOpen={hasValue}
      forceOpen={hasError}
    >
      <div className="entity-form__group">
        <AddressInput field="address.line1" bind={bind} />
        <AddressInput field="address.line2" bind={bind} />
        <div className="entity-form__row">
          <AddressInput field="address.city" bind={bind} />
          <AddressInput field="address.state" bind={bind} />
        </div>
        <div className="entity-form__row">
          <AddressInput field="address.postalCode" bind={bind} />
          <AddressInput field="address.country" bind={bind} />
        </div>
      </div>
    </Accordion>
  );
}
