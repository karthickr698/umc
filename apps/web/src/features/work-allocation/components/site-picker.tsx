import { useId } from 'react';
import { Check, MapPin } from 'lucide-react';
import type { SiteDto } from '@umc/shared';
import { Select } from '@/components/forms/select';
import { siteOption } from '@/lib/sites';
import { workerCount } from '../lib/notices';

/** Beyond this many sites the tiles get too long to scan, so a searchable dropdown is used. */
const MAX_TILES = 12;

export interface SitePickerProps {
  /** Sites that can take workers, sorted by name. */
  sites: readonly SiteDto[];
  value: string;
  onChange: (siteId: string) => void;
  /** Workers already at each site that day; `undefined` while the day loads. */
  assignedCounts: ReadonlyMap<string, number> | undefined;
  /** Id of the heading that names the picker. */
  labelledBy: string;
}

/** Sites as large tappable tiles showing who is already there; a dropdown for long lists. */
export function SitePicker({
  sites,
  value,
  onChange,
  assignedCounts,
  labelledBy,
}: SitePickerProps) {
  const name = useId();

  if (sites.length === 0) {
    return (
      <p className="site-picker__empty">There are no active or planned sites. Add a site first.</p>
    );
  }

  if (sites.length > MAX_TILES) {
    return (
      <div className="site-picker__select">
        <Select
          aria-labelledby={labelledBy}
          placeholder="Choose a site"
          required
          value={value}
          options={sites.map(siteOption)}
          onChange={onChange}
        />
      </div>
    );
  }

  return (
    <div className="site-picker" role="radiogroup" aria-labelledby={labelledBy}>
      {sites.map((site) => {
        const checked = site.id === value;
        const count = assignedCounts?.get(site.id) ?? 0;
        return (
          <label key={site.id} className={`site-tile${checked ? ' site-tile--checked' : ''}`}>
            <input
              type="radio"
              className="site-tile__input"
              name={name}
              value={site.id}
              checked={checked}
              onChange={() => onChange(site.id)}
            />
            <span className="site-tile__icon" aria-hidden>
              {checked ? <Check size={18} strokeWidth={3} /> : <MapPin size={18} />}
            </span>
            <span className="site-tile__text">
              <span className="site-tile__name">{site.name}</span>
              <span className="site-tile__meta">
                {site.code} ·{' '}
                {assignedCounts === undefined
                  ? '…'
                  : count > 0
                    ? `${workerCount(count)} already`
                    : 'Nobody yet'}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
