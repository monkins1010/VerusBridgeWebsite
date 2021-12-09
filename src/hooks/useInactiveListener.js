import { useEffect } from 'react';

import { useWeb3React } from '@web3-react/core';

import { useToast } from 'components/Toast/ToastProvider';

import { injectedConnector } from '../connectors/injectedConnector';

const useInactiveListener = (suppress = false) => {
  const { active, error, activate } = useWeb3React();
  const { addToast } = useToast();

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    const { ethereum } = window;
    if (ethereum && ethereum.on && !active && !error && !suppress) {
      const handleConnect = () => {
        addToast({ type: 'info', description: 'connected to wallet'});
        activate(injectedConnector);
      };
      const handleChainChanged = (chainId) => {
        // eslint-disable-next-line no-console
        console.log("Handling 'chainChanged' event with payload", chainId);
        addToast({ type: 'info', description: 'Chain changed!'})
        activate(injectedConnector);
      };
      const handleAccountsChanged = (accounts) => {
        // eslint-disable-next-line no-console
        console.log("Handling 'accountsChanged' event with payload", accounts);
        addToast({ type: 'info', description: 'Account changed!'})
        if (accounts.length > 0) {
          activate(injectedConnector);
        }
      };
      const handleNetworkChanged = (networkId) => {
        // eslint-disable-next-line no-console
        console.log("Handling 'networkChanged' event with payload", networkId);
        addToast({ type: 'info', description: 'Chain changed!'})
        activate(injectedConnector);
      };

      ethereum.on('connect', handleConnect);
      ethereum.on('chainChanged', handleChainChanged);
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('networkChanged', handleNetworkChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('connect', handleConnect);
          ethereum.removeListener('chainChanged', handleChainChanged);
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('networkChanged', handleNetworkChanged);
        }
      };
    }
  }, [active, error, suppress, activate]);

  return null;
};

export default useInactiveListener;
