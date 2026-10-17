/** Escapes user input so it can be embedded in a `RegExp` as a literal. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive "contains" matcher for free-text search over user input. */
export function containsInsensitive(value: string): RegExp {
  return new RegExp(escapeRegExp(value), 'i');
}
