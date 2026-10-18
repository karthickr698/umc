import { createContext, useContext } from 'react';
import type { ContractorDto } from '@umc/shared';

/** Opens a contractor's workers panel; `null` when the user may not view workers. */
export const ContractorWorkersContext = createContext<((contractor: ContractorDto) => void) | null>(
  null,
);

export function useOpenContractorWorkers() {
  return useContext(ContractorWorkersContext);
}
