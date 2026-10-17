import { Link } from 'react-router';
import { InlineAlert } from '@/components/feedback/inline-alert';
import type { SelectOptionsSource } from '@/hooks/use-select-options';

export interface MissingRecordsHintProps {
  source: SelectOptionsSource;
  /** Plural, lower-case, e.g. "sites". */
  noun: string;
  /** Page where those records are added. */
  path: string;
}

/** Explains an empty required choice and links to where the missing records are added. */
export function MissingRecordsHint({ source, noun, path }: MissingRecordsHintProps) {
  if (source.loading || source.failed || source.options.length > 0) return null;
  return (
    <InlineAlert tone="warn" title={`You have no ${noun} yet`}>
      <Link className="text-link" to={path}>
        Add {noun} first
      </Link>
      , then come back here.
    </InlineAlert>
  );
}
