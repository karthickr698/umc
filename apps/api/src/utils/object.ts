/** A shallow copy of `value` without its `undefined` keys, e.g. to echo query filters back. */
export function omitUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}
