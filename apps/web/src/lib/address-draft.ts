import { FIELD_LIMITS, type Address } from '@umc/shared';
import { textError } from './form-draft';

/** Draft keys of the address parts; they match the API's validation issue paths. */
export const ADDRESS_FIELDS = [
  'address.line1',
  'address.line2',
  'address.city',
  'address.state',
  'address.postalCode',
  'address.country',
] as const;

export type AddressField = (typeof ADDRESS_FIELDS)[number];

export type AddressDraft = Record<AddressField, string>;

export const ADDRESS_FIELD_RULES: Readonly<Record<AddressField, { label: string; max: number }>> = {
  'address.line1': { label: 'Address line 1', max: FIELD_LIMITS.addressLine },
  'address.line2': { label: 'Address line 2', max: FIELD_LIMITS.addressLine },
  'address.city': { label: 'City', max: FIELD_LIMITS.city },
  'address.state': { label: 'State', max: FIELD_LIMITS.state },
  'address.postalCode': { label: 'Postal code', max: FIELD_LIMITS.postalCode },
  'address.country': { label: 'Country', max: FIELD_LIMITS.country },
};

export function toAddressDraft(address: Address | undefined): AddressDraft {
  return {
    'address.line1': address?.line1 ?? '',
    'address.line2': address?.line2 ?? '',
    'address.city': address?.city ?? '',
    'address.state': address?.state ?? '',
    'address.postalCode': address?.postalCode ?? '',
    'address.country': address?.country ?? '',
  };
}

/** The filled-in parts only; `{}` clears a stored address on update. */
export function toAddress(draft: AddressDraft): Address {
  const address: Address = {};
  for (const field of ADDRESS_FIELDS) {
    const value = draft[field].trim();
    if (value) address[field.slice('address.'.length) as keyof Address] = value;
  }
  return address;
}

export function validateAddress(draft: AddressDraft): Partial<Record<AddressField, string>> {
  const errors: Partial<Record<AddressField, string>> = {};
  for (const field of ADDRESS_FIELDS) {
    const error = textError(draft[field], ADDRESS_FIELD_RULES[field]);
    if (error) errors[field] = error;
  }
  return errors;
}
