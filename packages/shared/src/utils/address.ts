import type { Address } from '../types/domain.js';

/** One line from the filled-in address parts; empty when nothing is set. */
export function formatAddress(address: Address | undefined): string {
  if (!address) return '';
  const { line1, line2, city, state, postalCode, country } = address;
  return [line1, line2, city, state, postalCode, country].filter(Boolean).join(', ');
}
