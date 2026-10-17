const SENSITIVE_KEY = /pass(word)?|secret|token|hash|api[-_]?key|authorization|cookie|credential/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Deep copy of `value` without keys that look like secrets (passwords, hashes, tokens, API keys)
 * or whose value is `undefined`. Non-plain objects such as `Date` and `ObjectId` are kept as is.
 */
export function redactSecrets<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item: unknown) => redactSecrets(item)) as T;
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, entry]) => entry !== undefined && !SENSITIVE_KEY.test(key))
      .map(([key, entry]) => [key, redactSecrets(entry)]),
  ) as T;
}
