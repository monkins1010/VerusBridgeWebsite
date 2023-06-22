import React, { useState } from 'react'

import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Grid } from '@mui/material'

import WalletCard from './WalletCard'
import { WALLET_CONFIG } from '../constants/walletConfig'

const WalletConnectDialog = ({ isOpen, onClose, onConfirm }) => {
  const [selectedWallet, setSelectedWalllet] = useState(null);

  const handleClickWallet = (wallet) => {
    setSelectedWalllet(wallet);
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Please select your wallet.
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {Object.values(WALLET_CONFIG).map(wallet => (
            <Grid item sm={6} key={wallet.title}>
              <WalletCard
                onClick={() => handleClickWallet(wallet)}
                isSelected={selectedWallet?.title === wallet.title}
              >
                {wallet.icon}
              </WalletCard>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          autoFocus
          variant="contained"
          onClick={onConfirm}
        >
          Select
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default WalletConnectDialog
