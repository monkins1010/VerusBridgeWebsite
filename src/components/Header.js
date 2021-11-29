import { AppBar, Toolbar, Typography } from '@mui/material'
import React, { useState } from 'react'
import WalletConnectDialog from './WalletConnectDialog';
import ConnectButton from '../components/ConnectButton'
import { useWeb3React } from '@web3-react/core';
import { injectedConnector } from '../connectors/injectedConnector';
import Logo from '../images/logos/verus-eth-bridge.png'

const Header = () => {
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const { account, chainId, error, activate, deactivate } = useWeb3React();

  const handleClickConnect = () => {
    if(account) {
      deactivate();
    } else {
      setWalletDialogOpen(true)
    }
  }

  const handleConfirm = async () => {
    try {
      await activate(injectedConnector);
      setWalletDialogOpen(false);
    } catch (error) {
      console.log({ error })
    }
  }

  const handleClickLogo = () => {
    window.location.reload();
  }

  return (
    <AppBar
      position="absolute"
      color="default"
      elevation={0}
      sx={{
        position: 'relative',
        borderBottom: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      <Toolbar>
        <img width="80px" style={{cursor: "pointer"}} onClick={handleClickLogo} src={Logo} />
        <Typography 
          variant="h6" 
          color="inherit" 
          noWrap 
          sx={{flexGrow: 1, marginLeft: '20px'}}
        >
          Verus
        </Typography>
        <ConnectButton onClick={handleClickConnect} />
        <WalletConnectDialog 
          isOpen={walletDialogOpen} 
          onClose={() => setWalletDialogOpen(false)}
          onConfirm={handleConfirm}
        />
      </Toolbar>
    </AppBar>
  )
}

export default Header
