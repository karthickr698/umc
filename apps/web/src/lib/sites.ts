import { SITE_STATUSES, type SiteDto, type SiteStatus } from '@umc/shared';
import type { SelectOption } from '@/components/forms/select-field';

/** Sites that can receive new workers; finished, cancelled and paused sites are left out. */
const ASSIGNABLE_SITE_STATUSES: ReadonlySet<SiteStatus> = new Set([
  SITE_STATUSES.ACTIVE,
  SITE_STATUSES.PLANNED,
]);

export function isAssignableSite(site: SiteDto): boolean {
  return ASSIGNABLE_SITE_STATUSES.has(site.status);
}

export function siteLabel(site: SiteDto | undefined): string {
  return site ? `${site.name} (${site.code})` : 'Unknown site';
}

/**
 * Calendar day `YYYY-MM-DD` of the site's start. Start dates are entered as days and stored at
 * UTC midnight, so the UTC date part is the day that was entered.
 */
export function siteStartDay(site: Pick<SiteDto, 'startDate'>): string | undefined {
  return site.startDate?.slice(0, 10);
}

export function siteOption(site: SiteDto): SelectOption {
  return { value: site.id, label: siteLabel(site) };
}

export function toSiteOptions(sites: readonly SiteDto[]): SelectOption[] {
  return sites.map(siteOption).sort((a, b) => a.label.localeCompare(b.label));
}
