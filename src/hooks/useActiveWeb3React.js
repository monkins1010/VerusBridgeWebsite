import { useWeb3React } from '@web3-react/core';

function useActiveWeb3React() {
  const context = useWeb3React();
  // const contextNetwork = useWeb3React<Web3Provider>(NetworkContextName);
  return context;
}

export default useActiveWeb3React;
