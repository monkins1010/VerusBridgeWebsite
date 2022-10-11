import React, { useEffect, useState } from 'react';

import { LoadingButton } from '@mui/lab';
import { Alert, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Box } from '@mui/system';
import { useWeb3React } from '@web3-react/core';
import { useForm } from 'react-hook-form';
import web3 from 'web3';

import ERC20_ABI from 'abis/ERC20Abi.json';
import NOTARIZER_ABI from 'abis/NotarizerAbi.json';
import NOTARIZER_STORAGE_ABI from 'abis/NotarizerStorageAbi.json';
import TOKEN_MANAGER_ABI from 'abis/TokenManagerAbi.json';
import VERUS_BRIDGE_MASTER_ABI from 'abis/VerusBridgeMasterAbi.json';
import VERUS_UPGRADE_ABI from 'abis/VerusUpgradeAbi.json';
import {
  BRIDGE_MASTER_ADD,
  GLOBAL_ADDRESS,
  ETH_FEES,
  UPGRADE_ADD,
  TOKEN_MANAGER_ADD
} from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getContract } from 'utils/contract';
import { getConfigOptions } from 'utils/txConfig';

import { useToast } from '../Toast/ToastProvider';
import AddressField from './NFTAddressField';
import NFTField from './NFTField';

const maxGas = 6000000;
const maxGas2 = 100000;
const FLAG_DEST_GATEWAY = 128;
const BRIDGE_STORAGE_ENUM = 8;
const NOTARIZER_STORAGE_ENUM = 9;
const NOTARIZER_ENUM = 4;

export default function NFTForm() {
  const [poolAvailable, setPoolAvailable] = useState(false);
  const [isTxPending, setIsTxPending] = useState(false);
  const [alert, setAlert] = useState(null);
  const [verusTestHeight, setVerusTestHeight] = useState(null);
  const [verusTokens, setVerusTokens] = useState(['']);
  const { addToast } = useToast();
  const { account, library } = useWeb3React();
  const verusBridgeMasterContract = useContract(BRIDGE_MASTER_ADD, VERUS_BRIDGE_MASTER_ABI);
  const verusUpgradeContract = useContract(UPGRADE_ADD, VERUS_UPGRADE_ABI);
  const tokenManagerContract = useContract(TOKEN_MANAGER_ADD, TOKEN_MANAGER_ABI);

  const { handleSubmit, control } = useForm({
    mode: 'all'
  });

  const checkBridgeLaunched = async (contract) => {
    try {
      const notarizerAddress = await verusUpgradeContract.contracts(NOTARIZER_ENUM);
      const notarizerStorageAddress = await verusUpgradeContract.contracts(NOTARIZER_STORAGE_ENUM);
      const notarizerContract = getContract(notarizerAddress, NOTARIZER_ABI, library, account);
      const notarizerStorageContract = getContract(notarizerStorageAddress, NOTARIZER_STORAGE_ABI, library, account);

      const pool = await contract.isPoolAvailable();
      setPoolAvailable(pool);
      const forksData = await notarizerContract.bestForks(0);
      const hashPos = 66;
      const hash = `0x${forksData.substring(hashPos, hashPos + 64).match(/[a-fA-F0-9]{2}/g).reverse().join('')}`
      const returnedNotarization = await notarizerStorageContract.getNotarization(hash);

      setVerusTestHeight(returnedNotarization.proofroots[1].rootheight)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      setVerusTestHeight(1);
    }
  }

  const getTokens = async () => {

    const tokens = await tokenManagerContract.getTokenList();
    const TOKEN_OPTIONS = tokens.map(e => ({ label: e.name, value: e.ticker, iaddress: e.iaddress, erc20address: e.erc20ContractAddress }))
    return TOKEN_OPTIONS
  }

  useEffect(() => {
    if (verusBridgeMasterContract && account && verusUpgradeContract) {
      checkBridgeLaunched(verusBridgeMasterContract);
    }
  }, [verusBridgeMasterContract, verusUpgradeContract, account])

  useEffect(async () => {
    if (tokenManagerContract && account) {
      const tokens = await getTokens();
      // REMOVE BELOW DEBUG
      // tokens.push({ label: "chriscoin", value: "CRS", iaddress: "0xc3ee4b592fd3ebd53ba757ae2daf484b20d75ae4", erc20address: "0xc3994c5cbddf7ce38b8a2ec2830335fa8f3eea6a" })
      setVerusTokens(tokens);
    }
  }, [tokenManagerContract, account])

  const authoriseOneTokenAmount = async (token, amount) => {
    setAlert(`Metamask will now pop up to allow the Verus Bridge Contract to spend ${amount}(${token.name}) from your Goerli balance.`);

    const tokenERC = verusTokens.filter(add => add.iaddress === token.value)[0].erc20address // await verusBridgeStorageContract.verusToERC20mapping(GLOBAL_ADDRESS[token])
    const tokenInstContract = getContract(tokenERC, ERC20_ABI, library, account)
    const decimals = web3.utils.toBN(await tokenInstContract.decimals());

    const ten = new web3.utils.BN(10);
    const base = ten.pow(new web3.utils.BN(decimals));
    const comps = amount.split('.');
    if (comps.length > 2) { throw new Error('Too many decimal points'); }

    let whole = comps[0];
    let fraction = comps[1];

    if (!whole) { whole = '0'; }
    if (!fraction) { fraction = '0'; }
    if (fraction.length > decimals) {
      throw new Error('Too many decimal places');
    }

    while (fraction.length < decimals) {
      fraction += '0';
    }

    whole = new web3.utils.BN(whole);
    fraction = new web3.utils.BN(fraction);
    const bigAmount = (whole.mul(base)).add(fraction);

    const bridgeStorageAddress = await verusUpgradeContract.contracts(BRIDGE_STORAGE_ENUM);

    await tokenInstContract.approve(bridgeStorageAddress, bigAmount.toString(), { from: account, gasLimit: maxGas2 })

    setAlert(`
      Your Goerli account has authorised the bridge to spend ${token.name} token, the amount: ${amount}. 
      \n Next, after this window please check the amount in Meta mask is what you wish to send.`
    );
  }

  const onSubmit = async (values) => {
    const { token, amount } = values;
    setAlert(null);
    setIsTxPending(true);

    try {
      if (token?.value !== GLOBAL_ADDRESS.ETH) {
        await authoriseOneTokenAmount(token, amount);
      }

      const result = getConfigOptions({ ...values, poolAvailable });

      if (result) {
        const { flagvalue, feecurrency, fees, destinationtype, destinationaddress, destinationcurrency, secondreserveid } = result;
        const verusAmount = (amount * 100000000);
        const currencyIaddress = token.value;
        const CReserveTransfer = {
          version: 1,
          currencyvalue: { currency: currencyIaddress, amount: verusAmount.toFixed(0) }, // currency sending from ethereum
          flags: flagvalue,
          feecurrencyid: feecurrency, // fee is vrsctest pre bridge launch, veth or others post.
          fees,
          destination: { destinationtype, destinationaddress }, // destination address currecny is going to
          destcurrencyid: destinationcurrency,   // destination currency is vrsc on direct. bridge.veth on bounceback
          destsystemid: "0x0000000000000000000000000000000000000000",     // destination system not used 
          secondreserveid    // used as return currency type on bounce back
        }

        const { BN } = web3.utils;
        const MetaMaskFee = new BN(web3.utils.toWei(ETH_FEES.ETH, 'ether'));

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
            <NFTField
              control={control}
              poolAvailable={poolAvailable}
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