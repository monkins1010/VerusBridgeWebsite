import { useEffect } from 'react';

import { useWeb3React } from '@web3-react/core';

import { networkConnector } from '../connectors/networkconnector';
import useEagerConnect from '../hooks/useEagerConnect';
import useInactiveListener from '../hooks/useInactiveListener';

function Web3ConnectionProvider({ children }) {
  const context = useWeb3React();
  const { activate, active } = context;

  const triedEager = useEagerConnect();

  useEffect(() => {
    if (triedEager && !active) {
      activate(networkConnector);
    }
  }, [triedEager, active, activate]);

  useInactiveListener(!triedEager);

  return children;
}

export default Web3ConnectionProvider;
