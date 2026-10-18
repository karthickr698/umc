/** A site belongs to one client, so switching client drops a site that may not match. */
export function clearSiteOnClientChange<F extends { clientId: string; siteId: string }>(
  changes: Partial<F>,
): Partial<F> {
  return changes.clientId !== undefined && changes.siteId === undefined
    ? { ...changes, siteId: '' }
    : changes;
}
