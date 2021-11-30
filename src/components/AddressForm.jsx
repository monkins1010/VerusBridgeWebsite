import React from 'react';

import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField';
import { Box } from '@mui/system';

export default function AddressForm() {
  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            id="address"
            name="address"
            label="Address"
            fullWidth
            variant="standard"
            helperText="I-Address, R-address, or Etherium address to send conversion back to Ethereum"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl variant="standard" fullWidth>
            <InputLabel id="token-label">Token</InputLabel>
            <Select
              labelId="token-label"
              id="token"
              label="Token"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem selected>Choose...</MenuItem>
              <MenuItem value="ETH">ETH</MenuItem>
              <MenuItem value="USDC">USDC</MenuItem>
              <MenuItem value="VRSCTEST">VRSCTEST</MenuItem>
              <MenuItem id="hidebridgetoken" value="bridge">Bridge.veth</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <FormControl variant="standard" fullWidth>
            <InputLabel id="destination-label">Destination</InputLabel>
            <Select
              labelId="destination-label"
              id="destionation"
              name="destination"
              label="Destination"
            >
              <MenuItem value=""><em>Choose...</em></MenuItem>
              <MenuItem id="hidevrsctest" value="vrsctest">To VRSCTEST wallet (no conversion)</MenuItem>
              <MenuItem id="hidebridge" value="bridge">Convert to Bridge.veth on VRSCTEST</MenuItem>
              <MenuItem id="hideUSDC" value="bridgeUSDC">Convert to USDC on VRSCTEST</MenuItem>
              <MenuItem id="hideVRSCTEST" value="bridgeVRSCTEST">Convert to VRSCTEST on VRSCTEST</MenuItem>
              <MenuItem id="hideETH" value="bridgeETH">Convert to ETH on VRSCTEST</MenuItem>
              <MenuItem id="hideswaptobridge" value="swaptoBRIDGE">Convert to bridge Token (Bounce back to ETH)</MenuItem>
              <MenuItem id="hideswaptovrsctest" value="swaptoVRSCTEST">Convert to VRSCTEST Token (Bounce back to ETH)</MenuItem>
              <MenuItem id="hideswaptousdc" value="swaptoUSDC">Convert to USDC Token (Bounce back to ETH)</MenuItem>
              <MenuItem id="hideswaptoeth" value="swaptoETH">Convert to ETH (Bounce back to ETH)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            id="amount"
            name="amount"
            label="Amount"
            type="number"
            fullWidth
            variant="standard"
          />
        </Grid>
        <Box mt="30px" textAlign="center" width="100%">
          <Button variant="contained">Send</Button>
        </Box>
      </Grid>
    </>
  );
}