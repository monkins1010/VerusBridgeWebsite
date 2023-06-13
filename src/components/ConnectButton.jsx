import React, { useEffect } from 'react'

import { Button } from '@mui/material';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import { NoEthereumProviderError, UserRejectedRequestError } from '@web3-react/injected-connector';

import { useToast } from './Toast/ToastProvider';
import { ID_NAME_MAPPING } from '../constants/chain';

const ConnectButton = ({ onClick }) => {
  const { account, chainId, error } = useWeb3React();
  const { addToast } = useToast();

  useEffect(() => {
    if (error instanceof NoEthereumProviderError) {
      addToast({ type: 'error', description: 'Ethereum was not provided.' })
    } else if (error instanceof UserRejectedRequestError) {
      addToast({ type: 'error', description: 'User rejected the connection' })
    } else if (error instanceof UnsupportedChainIdError) {
      addToast({ type: 'error', description: 'Metamask is not supporting the chain you are using. Please change your network on your Metamask.' })
    }
  }, [error])

  return (
    <Button
      variant="outlined"
      onClick={onClick}
    >
      {account ? `${account.substr(0, 6)}...${account.substr(account.length - 4)} (${ID_NAME_MAPPING[chainId].title})` : 'Connect Wallet'}
    </Button>
  )
}

export default ConnectButton
