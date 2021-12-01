import React from 'react';

import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { Box } from '@mui/system';
import { useWeb3React } from '@web3-react/core';
import { useForm } from 'react-hook-form';
import web3 from 'web3';


import ERC20_ABI from 'abis/ERC20Abi.json';
import TOKEN_MANAGER_ABI from 'abis/TokenManagerAbi.json';
import VERUS_BRIDGE_ABI from 'abis/VerusBridgeAbi.json';
import { BRIDGE_CONTRACT_ADD, ETH_ERC20ADD, GLOBAL_ADDRESS, TOKEN_MANAGERE_RC20ADD, USDC_ERC20ADD } from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getMaxAmount } from 'utils/contract';
import { convertVerusAddressToEthAddress } from 'utils/convert';
import { DESTINATION_OPTIONS, TOKEN_OPTIONS } from 'utils/options';
import { isiAddress, isRAddress, isETHAddress, validateAddress } from 'utils/rules';
import { getConfigOptions } from 'utils/txConfig';

import InputControlField from './InputControlField';
import SelectControlField from './SelectControlField';

const maxGas = 6000000;

const maxGas2 = 100000;

export default function AddressForm() {
  const { account } = useWeb3React();
  const verusBridgeContract = useContract(BRIDGE_CONTRACT_ADD, VERUS_BRIDGE_ABI);
  const tokenManInstContract = useContract(TOKEN_MANAGERE_RC20ADD, TOKEN_MANAGER_ABI);
  const USDCContract = useContract(USDC_ERC20ADD, ERC20_ABI);
  const ETHContract = useContract(ETH_ERC20ADD, ERC20_ABI);

  const { handleSubmit, control, watch } = useForm({
    mode: 'all'
  });

  const selectedToken = watch('token');

  const validateAmount = async (amount) => {
    if( selectedToken === 'USDC') {
      const maxAmount = await getMaxAmount(USDCContract, account);
      if(maxAmount < amount) {
        return `Amount is not available in your wallet. ${maxAmount} ${selectedToken}`
      }
      return true;
    } if (selectedToken === 'ETH') {
      const maxAmount = await getMaxAmount(ETHContract, account);
      if(maxAmount < amount) {
        return `Amount is not available in your wallet. ${maxAmount} ${selectedToken}`
      }
      return true;
    } if (selectedToken === 'VRSCTEST') {
      const VRSCTEST_ADD = await tokenManInstContract.verusToERC20mapping(GLOBAL_ADDRESS.VRSCTEST)
      const maxAmount = await getMaxAmount(tokenManInstContract, VRSCTEST_ADD);
      if(maxAmount < amount) {
        return `Amount is not available in your wallet. ${maxAmount} ${selectedToken}`
      }
      return true;
    } if (selectedToken === 'bridge') {
      const VRSCTEST_ADD = await tokenManInstContract.verusToERC20mapping(GLOBAL_ADDRESS.BRIDGE)
      const maxAmount = await getMaxAmount(tokenManInstContract, VRSCTEST_ADD);
      if(maxAmount < amount) {
        return `Amount is not available in your wallet. ${maxAmount} ${selectedToken}`
      }
      return true;
    }

    return true;
  }

  
  const onSubmit = async (values) => {
    
    const { address, token, amount } = values;

    const result = getConfigOptions(values);
    if(result) {
      const {flagvalue, feecurrency, fees, destinationtype, destinationaddress, destinationcurrency, secondreserveid} = result
      const verusAmount = (amount * 100000000);
      const CReserveTransfer =  {
        version : 1,
        currencyvalue : {currency: GLOBAL_ADDRESS[token] , amount: verusAmount.toFixed(0)}, // currency sending from ethereum
        flags : flagvalue,
        feecurrencyid : feecurrency, // fee is vrsctest pre bridge launch, veth or others post.
        fees,
        destination : {destinationtype, destinationaddress}, // destination address currecny is going to
        destcurrencyid : GLOBAL_ADDRESS[destinationcurrency],   // destination currency is veth on direct. bridge.veth on bounceback
        destsystemid : GLOBAL_ADDRESS.VRSCTEST,     // destination system going to can only be VRSCTEST
        secondreserveid    // used as return currency type on bounce back
      }
      const date = new Date();
      const n = date.toDateString();
      const time = date.toLocaleTimeString();
      console.log("Transaction output: ",`Date: ${n} Time: ${time}`);
      console.log(CReserveTransfer);

      await verusBridgeContract.export(CReserveTransfer)
        .send({from: address, gas: maxGas, value: web3.utils.toWei(token === 'ETH' ? amount : '0.0006', 'ether')});
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <InputControlField
            name="address"
            label="Address"
            fullWidth
            variant="standard"
            defaultValue=""
            control={control}
            helperText="I-Address, R-address, or Etherium address to send conversion back to Ethereum"
            rules={{
              required: 'Address is required',
              validate: validateAddress
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <SelectControlField 
            name="token"
            label="Token"
            fullWidth
            variant="standard"
            defaultValue=""
            control={control}
            options={TOKEN_OPTIONS}
            rules={{
              required: 'Address is required'
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <SelectControlField 
            name="destination"
            label="Destination"
            fullWidth
            defaultValue=""
            variant="standard"
            control={control}
            options={DESTINATION_OPTIONS}
            rules={{
              required: 'Destination is required'
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <InputControlField
            name="amount"
            label="Amount"
            fullWidth
            variant="standard"
            control={control}
            type="number"
            defaultValue="0"
            min={0}
            rules={{
              required: 'Amount is required',
              min: {
                value: 0,
                message: 'Amount should be more than 0.'
              },
              max: {
                value: 100000,
                message: "Amount too large try a smaller amount"
              },
              validate: validateAmount
            }}
          />
        </Grid>
        <Box mt="30px" textAlign="center" width="100%">
          <Button type="submit" variant="contained">Send</Button>
        </Box>
      </Grid>
    </form>
  );
}