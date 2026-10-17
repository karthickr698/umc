import { ADDRESS_FIELD_RULES, type AddressField } from '@/lib/address-draft';
import type { BoundField } from '@/hooks/use-entity-form';
import { TextField } from './text-field';

export interface AddressFieldsProps {
  bind: (field: AddressField) => BoundField;
}

function AddressInput({ field, bind }: AddressFieldsProps & { field: AddressField }) {
  const { label, max } = ADDRESS_FIELD_RULES[field];
  return <TextField label={label} maxLength={max} placeholder="Optional" {...bind(field)} />;
}

/** The optional parts of an `Address`, grouped under one legend. */
export function AddressFields({ bind }: AddressFieldsProps) {
  return (
    <fieldset className="field-group entity-form__group">
      <legend className="field__label">Address</legend>
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
    </fieldset>
  );
}
