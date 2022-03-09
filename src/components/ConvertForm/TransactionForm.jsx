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
  GLOBAL_ADDRESS,
  NOTARIZER_CONTRACT_ADD,
  TOKEN_MANAGER_ERC20,
  ETH_FEES
} from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getContract } from 'utils/contract';
import { getConfigOptions } from 'utils/txConfig';

import { useToast } from '../Toast/ToastProvider';
import AddressField from './AddressField';
import AmountField from './AmountField';
import DestinationField from './DestinationField';
import TokenField from './TokenField';

const maxGas = 6000000;
const maxGas2 = 100000;
const FLAG_DEST_GATEWAY = 128

export default function TransactionForm() {
  const [poolAvailable, setPoolAvailable] = useState(0);
  const [isTxPending, setIsTxPending] = useState(false);
  const [alert, setAlert] = useState(null);
  const [verusTestHeight, setVerusTestHeight] = useState(null);
  const { addToast } = useToast();
  const { account, library } = useWeb3React();
  const verusBridgeContract = useContract(BRIDGE_CONTRACT_ADD, VERUS_BRIDGE_ABI);
  const tokenManInstContract = useContract(TOKEN_MANAGER_ERC20, TOKEN_MANAGER_ABI);
  const NotarizerInstContract = useContract(NOTARIZER_CONTRACT_ADD, NOTARIZER_ABI);

  const { handleSubmit, control, watch } = useForm({
    mode: 'all'
  });
  const selectedToken = watch('token');
  const address = watch('address');

  const checkBridgeLaunched = async (contract) => {
    try {
      const pool = await contract.poolAvailable(GLOBAL_ADDRESS.BRIDGE);
      setPoolAvailable(pool);
      const lastProof = await contract.getLastProofRoot();
      setVerusTestHeight(lastProof.rootheight);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
    }
  }

  useEffect(() => {
    if (NotarizerInstContract && account) {
      checkBridgeLaunched(NotarizerInstContract);
    }
  }, [NotarizerInstContract, account])

  const authoriseOneTokenAmount = async (token, amount) => {
    setAlert(`Metamask will now pop up to allow the Verus Bridge Contract to spend ${amount}(${token}) from your Rinkeby balance.`);
    const tokenERCAddress = await tokenManInstContract.verusToERC20mapping(GLOBAL_ADDRESS[token])
    const tokenInstContract = getContract(tokenERCAddress[0], ERC20_ABI, library, account)
    const decimals = await tokenInstContract.decimals();
    const bigAmount = new web3.utils.BN(amount).mul(new web3.utils.BN(10 ** decimals)).toString();
    // const bigAmount = parseInt(amount.toString(10), 10) * (10 ** decimals);

    await tokenInstContract.increaseAllowance(BRIDGE_CONTRACT_ADD, bigAmount, { from: account, gasLimit: maxGas2 })

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
      if (['USDC', 'VRSCTEST', 'BRIDGE'].includes(token)) {
        await authoriseOneTokenAmount(token, parseFloat(amount));
      }

      const result = getConfigOptions({ ...values, poolAvailable });

      if (result) {
        const { flagvalue, feecurrency, fees, destinationtype, destinationaddress, destinationcurrency, secondreserveid } = result;
        const verusAmount = (amount * 100000000);
        const CReserveTransfer = {
          version: 1,
          currencyvalue: { currency: GLOBAL_ADDRESS[token], amount: verusAmount.toFixed(0) }, // currency sending from ethereum
          flags: flagvalue,
          feecurrencyid: feecurrency, // fee is vrsctest pre bridge launch, veth or others post.
          fees,
          destination: { destinationtype, destinationaddress }, // destination address currecny is going to
          destcurrencyid: GLOBAL_ADDRESS[destinationcurrency],   // destination currency is veth on direct. bridge.veth on bounceback
          destsystemid: "0x0000000000000000000000000000000000000000",     // destination system not used 
          secondreserveid    // used as return currency type on bounce back
        }

        const { BN } = web3.utils;
        let MetaMaskFee = new BN(web3.utils.toWei(ETH_FEES.ETH, 'ether'));
        // eslint-disable-next-line
        if (destinationtype & FLAG_DEST_GATEWAY) {
          MetaMaskFee = MetaMaskFee.add(new BN(web3.utils.toWei(ETH_FEES.ETH, 'ether')));
        }

        if (token === 'ETH') {
          MetaMaskFee = MetaMaskFee.add(new BN(web3.utils.toWei(amount, 'ether')));
        }

        const txResult = await verusBridgeContract.export(
          CReserveTransfer,
          { from: account, gasLimit: maxGas, value: MetaMaskFee.toString() }
        );
        const waitResult = await txResult.wait();

        addToast({ type: "success", description: 'Transaction Success!' });
        setAlert(null);
        setIsTxPending(false);
      } else {
        throw new Error('something went wrong');
      }
    } catch (error) {
      if (error.message) {
        addToast({ type: "error", description: error.message })
      } else {
        addToast({ type: "error", description: 'Transaction Failed!' })
      }
      setAlert(null);
      setIsTxPending(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        {alert &&
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography>
              {alert}
            </Typography>
          </Alert>
        }
        {account ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography>
              {poolAvailable !== 0 ? "Bridge.veth currency Launched." : "Bridge.veth currency not launched."}
            </Typography>
            <Typography>
              Last Confirmed VerusTest height: <b>{verusTestHeight}</b>
            </Typography>
          </Alert>
        ) :
          (<Alert severity="info" sx={{ mb: 3 }}>
            <Typography>
              <b>Wallet not connected</b>
            </Typography>
          </Alert>)
        }
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <AddressField
              control={control}
            />
          </Grid>
          <Grid item xs={12}>
            <TokenField
              control={control}
              poolAvailable={poolAvailable}
            />
          </Grid>
          <Grid item xs={12}>
            <DestinationField
              control={control}
              poolAvailable={poolAvailable}
              address={address}
              selectedToken={selectedToken}
            />
          </Grid>
          <Grid item xs={12}>
            <AmountField
              control={control}
              selectedToken={selectedToken}
            />
          </Grid>
          <Box mt="30px" textAlign="center" width="100%">
            <LoadingButton loading={isTxPending} type="submit" color="primary" variant="contained">Send</LoadingButton>
          </Box>
        </Grid>
      </form>
    </>
  );
}