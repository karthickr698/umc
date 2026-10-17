import {
  FIELD_LIMITS,
  SITE_STATUSES,
  type CreateSiteRequest,
  type SiteDto,
  type UpdateSiteRequest,
} from '@umc/shared';
import { toAddress, toAddressDraft, validateAddress, type AddressDraft } from '@/lib/address-draft';
import { changedFields, textError, toEnum, withoutEmpty, type DraftErrors } from '@/lib/form-draft';
import { siteStartDay } from '@/lib/sites';
import { isCalendarDate } from '@/utils/calendar-date';

export type SiteDraft = AddressDraft & {
  name: string;
  clientId: string;
  status: string;
  startDate: string;
};

export function toSiteDraft(site?: SiteDto): SiteDraft {
  return {
    name: site?.name ?? '',
    clientId: site?.clientId ?? '',
    status: site?.status ?? SITE_STATUSES.PLANNED,
    startDate: (site && siteStartDay(site)) ?? '',
    ...toAddressDraft(site?.address),
  };
}

/** The API can move a start date but not clear it, so emptying a stored one is an error. */
function startDateError(value: string, site?: SiteDto) {
  if (!value) return site?.startDate ? 'Pick a new start date; it cannot be removed' : undefined;
  return isCalendarDate(value) ? undefined : 'Enter a valid date';
}

export function validateSiteDraft(draft: SiteDraft, site?: SiteDto) {
  const errors: DraftErrors<SiteDraft> = {
    name: textError(draft.name, { label: 'Name', max: FIELD_LIMITS.name, required: true }),
    clientId: draft.clientId ? undefined : 'Choose a client',
    startDate: startDateError(draft.startDate, site),
    ...validateAddress(draft),
  };
  return errors;
}

function toRequest(draft: SiteDraft): CreateSiteRequest {
  return {
    name: draft.name.trim(),
    clientId: draft.clientId,
    address: toAddress(draft),
    status: toEnum(SITE_STATUSES, draft.status, SITE_STATUSES.PLANNED),
    ...(draft.startDate && { startDate: draft.startDate }),
  };
}

export function toCreateSiteRequest(draft: SiteDraft): CreateSiteRequest {
  const { name, clientId, ...rest } = toRequest(draft);
  return { ...withoutEmpty(rest), name, clientId };
}

export function toSiteChanges(site: SiteDto, draft: SiteDraft): UpdateSiteRequest {
  return changedFields(toRequest(toSiteDraft(site)), toRequest(draft));
}
