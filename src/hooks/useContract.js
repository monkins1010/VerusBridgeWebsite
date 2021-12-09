import { useMemo } from 'react';

import { getContract } from 'utils/contract';

import useActiveWeb3React from './useActiveWeb3React';

// returns null on errors
const useContract = (
  address,
  ABI,
  withSignerIfPossible = true
) => {
  const { library, account } = useActiveWeb3React();

  return useMemo(() => {
    if (!address || !ABI || !library) return null;
    try {
      return getContract(
        address,
        ABI,
        library,
        withSignerIfPossible && account ? account : undefined
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to get contract', error);
      return null;
    }
  }, [address, ABI, library, withSignerIfPossible, account]);
};

export default useContract;
