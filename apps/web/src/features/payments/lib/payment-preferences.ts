import type { PaymentMode } from '@umc/shared';
import { isPaymentMode } from '@/lib/payment-modes';

const STORAGE_KEY = 'umc.payment-entry.preferences';

/** What the last saved payment used, so the next entry starts from the same choices. */
export interface PaymentPreferences {
  siteId?: string;
  paymentMode?: PaymentMode;
}

/** Storage failures (e.g. private mode) and malformed values fall back to no preferences. */
export function readPaymentPreferences(): PaymentPreferences {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null) return {};
    const { siteId, paymentMode } = parsed as Record<string, unknown>;
    return {
      ...(typeof siteId === 'string' && siteId && { siteId }),
      ...(isPaymentMode(paymentMode) && { paymentMode }),
    };
  } catch {
    return {};
  }
}

export function savePaymentPreferences(preferences: PaymentPreferences): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Preferences just won't survive a reload.
  }
}
