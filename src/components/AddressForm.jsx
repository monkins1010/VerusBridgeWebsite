import React, { useEffect, useState } from 'react';

import { LoadingButton } from '@mui/lab';
import { Alert, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Box } from '@mui/system';
import { useWeb3React } from '@web3-react/core';
import { useForm } from 'react-hook-form';
import web3 from 'web3'

import ERC20_ABI from 'abis/ERC20Abi.json';
import NOTARIZER_ABI from 'abis/Notarizerabi.json';
import TOKEN_MANAGER_ABI from 'abis/TokenManagerAbi.json';
import VERUS_BRIDGE_ABI from 'abis/VerusBridgeAbi.json';
import { 
  BRIDGE_CONTRACT_ADD, 
  ETH_ERC20ADD, 
  GLOBAL_ADDRESS, 
  NOTARIZER_CONTRACT_ADD, 
  TOKEN_MANAGERE_RC20ADD, 
  USDC_ERC20ADD 
} from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getContract, getMaxAmount } from 'utils/contract';
import { getDestinationOptions, getTokenOptions } from 'utils/options';
import { validateAddress } from 'utils/rules';
import { getConfigOptions } from 'utils/txConfig';

import InputControlField from './InputControlField';
import SelectControlField from './SelectControlField';
import { useToast } from './Toast/ToastProvider';

const maxGas = 6000000;
const maxGas2 = 100000;

export default function AddressForm() {
  const [poolAvailable, setPoolAvailable] = useState(null);
  const [isTxPending, setIsTxPending] = useState(false);
  const [alert, setAlert] = useState(null);
  const [verusTestHeight, setVerusTestHeight] = useState(null);
  const { addToast } = useToast();
  const { account, library } = useWeb3React();
  const verusBridgeContract = useContract(BRIDGE_CONTRACT_ADD, VERUS_BRIDGE_ABI);
  const tokenManInstContract = useContract(TOKEN_MANAGERE_RC20ADD, TOKEN_MANAGER_ABI);
  const USDCContract = useContract(USDC_ERC20ADD, ERC20_ABI);
  const ETHContract = useContract(ETH_ERC20ADD, ERC20_ABI);
  const NotarizerInstContract = useContract(NOTARIZER_CONTRACT_ADD,  NOTARIZER_ABI);
  
  const { handleSubmit, control, watch } = useForm({
    mode: 'all'
  });
  const selectedToken = watch('token');

  const checkBridgeLaunched = async (contract) => {
    try {
      const pool = await contract.poolAvailable(GLOBAL_ADDRESS.BRIDGE);
      setPoolAvailable(pool);
      const lastProof = await contract.getLastProofRoot();
      setVerusTestHeight(lastProof.rootheight);
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if(NotarizerInstContract && account) {
      checkBridgeLaunched(NotarizerInstContract);
    }
  }, [NotarizerInstContract, account])

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
    } if (selectedToken === 'BRIDGE') {
      const VRSCTEST_ADD = await tokenManInstContract.verusToERC20mapping(GLOBAL_ADDRESS.BRIDGE)
      const maxAmount = await getMaxAmount(tokenManInstContract, VRSCTEST_ADD);
      if(maxAmount < amount) {
        return `Amount is not available in your wallet. ${maxAmount} ${selectedToken}`
      }
      return true;
    }

    if(amount > 100000) {
      return 'Amount too large. Try a smaller amount.'
    }

    if(amount <= 0) {
      return 'Amount is not valid.'
    }

    return true;
  }

  const authoriseOneTokenAmount = async (token, amount) => {
    setAlert(`Metamask will now pop up to allow the Verus Bridge Contract to spend ${amount}(${token}) from your Rinkeby balance.`);
    const tokenERCAddress = await tokenManInstContract.verusToERC20mapping(GLOBAL_ADDRESS[token])
    const tokenInstContract = getContract(tokenERCAddress[0], ERC20_ABI, library, account)
    const decimals = await tokenInstContract.decimals();
    const bigAmount = parseInt(amount.toString(), 10) * (10 ** decimals);

    await tokenInstContract.increaseAllowance(BRIDGE_CONTRACT_ADD, bigAmount, {from: account, gasLimit: maxGas2})

    setAlert(`
      Your Rinkeby account has authorised the bridge to spend ${token} token, the amount: ${amount}. 
      \n Next, after this window please check the amount in Meta mask is what you wish to send.`
    );
  }

  const onSubmit = async (values) => {
    const { token, amount } = values;
    setAlert(null);
    setIsTxPending(true);

    try {
      if(['USDC', 'VRSCTEST', 'BRIDGE'].includes(token)) {
        await authoriseOneTokenAmount(token, parseFloat(amount));
      }

      const result = getConfigOptions({...values, poolAvailable});
      
      if(result) {
        const {flagvalue, feecurrency, fees, destinationtype, destinationaddress, destinationcurrency, secondreserveid} = result;
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

        const txResult = await verusBridgeContract.export(
          CReserveTransfer, 
          {from: account, gasLimit: maxGas, value: web3.utils.toWei(token === 'ETH' ? amount : '0.0006', 'ether')}
        );
        await txResult.wait();

        addToast({type: "success", description: 'Transaction Success!'});
        setAlert(null);
        setIsTxPending(false);
      } else {
        throw new Error('something went wrong');
      }
    } catch (error) {
      if(error.message) {
        addToast({type: "error", description: error.message })
      } else {
        addToast({type: "error", description: 'Transaction Failed!'})
      }
      setAlert(null);
      setIsTxPending(false);
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)}>
      {alert && 
        <Alert severity="warning" sx={{ mb : 3}}>
          <Typography>
            {alert}
          </Typography>
        </Alert>
      }
      <Alert severity="info" sx={{ mb : 3}}>
        <Typography>
          {poolAvailable !== "0" ? "Bridge.veth currency Launched.": "Bridge.veth currency not launched."}
        </Typography>
        {verusTestHeight && (
          <Typography>
            Last Confirmed VerusTest height: <b>{verusTestHeight}</b>
          </Typography>
        )}
      </Alert>

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
            id="token"
            label="Token"
            fullWidth
            variant="standard"
            defaultValue=""
            control={control}
            options={getTokenOptions(poolAvailable)}
            rules={{
              required: 'Address is required'
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <SelectControlField 
            name="destination"
            id="destination"
            label="Destination"
            fullWidth
            defaultValue=""
            variant="standard"
            control={control}
            options={getDestinationOptions(poolAvailable)}
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
          <LoadingButton loading={isTxPending} type="submit" variant="contained">Send</LoadingButton>
        </Box>
      </Grid>
    </form>
    </>
  );
}