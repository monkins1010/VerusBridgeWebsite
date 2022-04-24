import React, { useEffect, useState } from 'react';

import { LoadingButton } from '@mui/lab';
import { Alert, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Box } from '@mui/system';
import { useWeb3React } from '@web3-react/core';
import { useForm } from 'react-hook-form';
import web3 from 'web3';

import ERC20_ABI from 'abis/ERC20Abi.json';
import VERUS_BRIDGE_MASTER_ABI from 'abis/VerusBridgeMasterAbi.json';
import VERUS_BRIDGE_STORAGE_ABI from 'abis/VerusBridgeStorageAbi.json';
import VERUS_UPGRADE_ABI from 'abis/VerusUpgradeAbi.json';
import {
  BRIDGE_MASTER_ADD,
  GLOBAL_ADDRESS,
  BRIDGE_STORAGE_ADD,
  ETH_FEES,
  UPGRADE_ADD
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
const FLAG_DEST_GATEWAY = 128;
const BRIDGE_STORAGE_ENUM = 8;

export default function TransactionForm() {
  const [poolAvailable, setPoolAvailable] = useState(false);
  const [isTxPending, setIsTxPending] = useState(false);
  const [alert, setAlert] = useState(null);
  const [verusTestHeight, setVerusTestHeight] = useState(null);
  const { addToast } = useToast();
  const { account, library } = useWeb3React();
  const verusBridgeMasterContract = useContract(BRIDGE_MASTER_ADD, VERUS_BRIDGE_MASTER_ABI);
  const verusBridgeStorageContract = useContract(BRIDGE_STORAGE_ADD, VERUS_BRIDGE_STORAGE_ABI);
  const verusUpgradeContract = useContract(UPGRADE_ADD, VERUS_UPGRADE_ABI);

  const { handleSubmit, control, watch } = useForm({
    mode: 'all'
  });
  const selectedToken = watch('token');
  const address = watch('address');

  const checkBridgeLaunched = async (contract) => {
    try {
      const pool = await contract.isPoolAvailable();
      setPoolAvailable(pool);
      const lastProof = await contract.getLastProofRoot();
      setVerusTestHeight(lastProof.rootheight);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
    }
  }

  useEffect(() => {
    if (verusBridgeMasterContract && account) {
      checkBridgeLaunched(verusBridgeMasterContract);
    }
  }, [verusBridgeMasterContract, account])

  const authoriseOneTokenAmount = async (token, amount) => {
    setAlert(`Metamask will now pop up to allow the Verus Bridge Contract to spend ${amount}(${token}) from your Rinkeby balance.`);
    const tokenMappingInfo = await verusBridgeStorageContract.verusToERC20mapping(GLOBAL_ADDRESS[token])
    const tokenInstContract = getContract(tokenMappingInfo.erc20ContractAddress, ERC20_ABI, library, account)
    const decimals = await tokenInstContract.decimals();
    const bigAmount = new web3.utils.BN(amount).mul(new web3.utils.BN(10 ** decimals)).toString();
    // const bigAmount = parseInt(amount.toString(10), 10) * (10 ** decimals);

    const tokenManagerAddress = await verusUpgradeContract.contracts(BRIDGE_STORAGE_ENUM);

    await tokenInstContract.increaseAllowance(tokenManagerAddress, bigAmount, { from: account, gasLimit: maxGas2 })

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

        const txResult = await verusBridgeMasterContract.export(
          CReserveTransfer,
          { from: account, gasLimit: maxGas, value: MetaMaskFee.toString() }
        );
        await txResult.wait();

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
              {poolAvailable ? "Bridge.veth currency Launched." : "Bridge.veth currency not launched."}
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