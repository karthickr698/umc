export interface AddressValueProps {
  /** From `addressLines()`. */
  lines: readonly string[];
}

/** A postal address, one line per part. */
export function AddressValue({ lines }: AddressValueProps) {
  return (
    <address className="details__address">
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </address>
  );
}
