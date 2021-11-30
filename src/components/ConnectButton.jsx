import React, { useEffect } from 'react'

import { Button } from '@mui/material';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import { NoEthereumProviderError, UserRejectedRequestError } from '@web3-react/injected-connector';

import { ID_NAME_MAPPING } from '../constants/chain';

const ConnectButton = ({ onClick }) => {
  const { account, chainId, error } = useWeb3React();
  
  useEffect(() => {
    if (error instanceof NoEthereumProviderError) {
      console.log({ title: 'Metamask connection error', type: 'TOAST_ERROR', description: 'Ethereum was not provided.' })
    } else if (error instanceof UserRejectedRequestError) {
      console.log({ title: 'Metamask connection error', type: 'TOAST_ERROR', description: 'User rejected the connection' })
    } else if (error instanceof UnsupportedChainIdError) {
      console.log({ title: 'Metamask connection error', type: 'TOAST_ERROR', description: 'Metamask is not supporting the chain you are using. Please change your network on your Metamask.' })
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
