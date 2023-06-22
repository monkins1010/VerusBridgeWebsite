import React, { useState } from 'react'

import { AppBar, Toolbar, Typography } from '@mui/material'
import { useWeb3React } from '@web3-react/core';

import ConnectButton from './ConnectButton'
import WalletConnectDialog from './WalletConnectDialog';
import { injectedConnector } from '../connectors/injectedConnector';
import Logo from '../images/logos/verus-eth-bridge.png'

const Header = () => {
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const { account, activate, deactivate } = useWeb3React();

  const handleClickConnect = () => {
    if (account) {
      deactivate();
    } else {
      setWalletDialogOpen(true)
    }
  }

  const handleConfirm = async () => {
    await activate(injectedConnector);
    setWalletDialogOpen(false);
  }

  return (
    <AppBar
      position="absolute"
      color="default"
      elevation={0}
      sx={{
        position: 'relative',
        borderBottom: (t) => `1px solid ${t.palette.divider}`
      }}
    >
      <Toolbar>
        <img width="80px" alt="logo" style={{ cursor: "pointer" }} src={Logo} />
        <Typography
          variant="h6"
          color="inherit"
          noWrap
          sx={{ flexGrow: 1, marginLeft: '20px' }}
        >
          (VRSCTEST)
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
