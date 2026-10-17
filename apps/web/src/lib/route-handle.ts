/** Shape of the `handle` attached to route objects in `router.tsx`. */
export interface RouteHandle {
  breadcrumb?: string;
}

export function getBreadcrumb(handle: unknown): string | undefined {
  if (typeof handle !== 'object' || handle === null || !('breadcrumb' in handle)) return undefined;
  return typeof handle.breadcrumb === 'string' ? handle.breadcrumb : undefined;
}
