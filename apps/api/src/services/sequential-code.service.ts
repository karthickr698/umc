import * as counterRepository from '../repositories/counter.repository.js';

export interface SequentialCodeFormat {
  prefix: string;
  sequenceDigits: number;
}

/**
 * Next `PREFIX-0001`-style code of the company's `counter` sequence. Skips codes already taken,
 * e.g. by records whose code was entered by hand.
 */
export async function nextSequentialCode(
  companyId: string,
  counter: string,
  { prefix, sequenceDigits }: SequentialCodeFormat,
  isTaken: (code: string) => Promise<boolean>,
): Promise<string> {
  for (;;) {
    const seq = await counterRepository.next(companyId, counter);
    const code = `${prefix}-${String(seq).padStart(sequenceDigits, '0')}`;
    if (!(await isTaken(code))) return code;
  }
}
