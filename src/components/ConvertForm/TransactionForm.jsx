import React, { useEffect, useState } from 'react';

import { ECPair, networks } from '@bitgo/utxo-lib';
import { LoadingButton } from '@mui/lab';
import { Alert, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Box } from '@mui/system';
import { useWeb3React } from '@web3-react/core';
import { utils } from 'ethers'
import { useForm } from 'react-hook-form';
import web3 from 'web3';

import DELEGATOR_ABI from 'abis/DelegatorAbi.json';
import ERC20_ABI from 'abis/ERC20Abi.json';
import {
  DELEGATOR_ADD,
  GLOBAL_ADDRESS,
  ETH_FEES
} from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getContract } from 'utils/contract';
import { getConfigOptions } from 'utils/txConfig';

import AddressField from './AddressField';
import AmountField from './AmountField';
import DestinationField from './DestinationField';
import TokenField from './TokenField';
import { useToast } from '../Toast/ToastProvider';

const maxGas = 6000000;
const maxGas2 = 100000;
const FLAG_DEST_GATEWAY = 128;
const { GAS_TRANSACTIONIMPORTFEE, MINIMUM_GAS_PRICE_WEI } = ETH_FEES;

export default function TransactionForm() {
  const [poolAvailable, setPoolAvailable] = useState(false);
  const [isTxPending, setIsTxPending] = useState(false);
  const [alert, setAlert] = useState(null);
  const [verusTestHeight, setVerusTestHeight] = useState(null);
  const [verusTokens, setVerusTokens] = useState(['']);
  const [GASPrice, setGASPrice] = useState("");
  const { addToast } = useToast();
  const { account, library } = useWeb3React();
  const delegatorContract = useContract(DELEGATOR_ADD, DELEGATOR_ABI);
  const [pubkey, setPubkey] = useState('');

  const { handleSubmit, control, watch } = useForm({
    mode: 'all'
  });
  const selectedToken = watch('token');
  const address = watch('address');
  const token = watch('token');

  const getArticlesFromApi = async () => {

    const latestBlock = await library.getBlockNumber();
    const block = await library.getBlock(latestBlock - 10);
    const transaction = await library.getTransaction(block.transactions[Math.ceil(block.transactions.length / 2)]);

    // eslint-disable-next-line
    const gasPriceInWei = web3.utils.hexToNumber(transaction.gasPrice._hex);
    const gasPriceInWeiBN = new web3.utils.BN(gasPriceInWei);

    // eslint-disable-next-line no-console
    const gasPricePlusBuffer = gasPriceInWeiBN.mul(new web3.utils.BN('12')).div(new web3.utils.BN('10')) // add 20%

    if (gasPricePlusBuffer.lt(new web3.utils.BN(MINIMUM_GAS_PRICE_WEI))) {

      const minimumSATSFee = new web3.utils.BN(GAS_TRANSACTIONIMPORTFEE).toString();
      const minimumWEIFee = new web3.utils.BN(MINIMUM_GAS_PRICE_WEI).mul(new web3.utils.BN(GAS_TRANSACTIONIMPORTFEE)).toString();
      return { SATSCOST: minimumSATSFee, WEICOST: minimumWEIFee };
    }

    const gasInSats = gasPricePlusBuffer.mul(new web3.utils.BN(GAS_TRANSACTIONIMPORTFEE)).div(new web3.utils.BN("10000000000")).toString();  // divide WEI by 10,000,000,000 to get into sats
    const weiPrice = gasPricePlusBuffer.mul(new web3.utils.BN(GAS_TRANSACTIONIMPORTFEE)).toString();

    return { SATSCOST: gasInSats, WEICOST: weiPrice };

  };
  const checkBridgeLaunched = async (contract) => {
    try {
      const GASPrices = await getArticlesFromApi();
      const pool = await contract.callStatic.bridgeConverterActive();
      setGASPrice(GASPrices);
      setPoolAvailable(pool);
      const forksData = await delegatorContract.callStatic.bestForks(0);
      const heightPos = 194;
      const heightHex = parseInt(`0x${forksData.substring(heightPos, heightPos + 8)}`, 16);
      setVerusTestHeight(heightHex || 1);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      setVerusTestHeight(1);
    }
  }

  const getTokens = async () => {

    const tokens = await delegatorContract.callStatic.getTokenList(0, 0);
    const TOKEN_OPTIONS = tokens.map(e => ({ label: e.name, value: e.ticker, iaddress: e.iaddress, erc20address: e.erc20ContractAddress }))
    return TOKEN_OPTIONS
  }

  useEffect(() => {
    if (delegatorContract && account) {
      checkBridgeLaunched(delegatorContract);
    }
  }, [delegatorContract, account])

  useEffect(async () => {
    if (delegatorContract && account) {
      const tokens = await getTokens();
      setVerusTokens(tokens);
    }
  }, [delegatorContract, account])

  useEffect(async () => {
    if (account) {

      const items = JSON.parse(localStorage.getItem('pubkeyAddress'));
      if (items) {
        setPubkey(items);
        const objKeys = Object.keys(items);

        if (objKeys.indexOf(account) > -1) {
          return
        }
      }

      try {
        const from = account;
        // For historical reasons, you must submit the message to sign in hex-encoded UTF-8.
        // This uses a Node.js-style buffer shim in the browser.
        const msg = `0x${Buffer.from("Agreeing to this will create a public key address for Verus Refunds.", 'utf8').toString('hex')}`;
        const sign = await window.ethereum.request({
          method: 'personal_sign',
          params: [msg, from]
        });

        const messageHash = utils.hashMessage("Agreeing to this will create a public key address for Verus Refunds.");
        const messageHashBytes = utils.arrayify(messageHash);

        // Now you have the digest,
        const publicKey = utils.recoverPublicKey(messageHashBytes, sign);

        // Compress key
        const oddEven = (parseInt(publicKey.slice(131), 16) % 2 === 0) ? "02" : "03";
        const formatted = `${oddEven}${publicKey.slice(4, 68)}`;
        const rAddress = ECPair.fromPublicKeyBuffer(Buffer.from(formatted, 'hex'), networks.verustest).getAddress()
        // eslint-disable-next-line no-console
        console.log({ address: account, publicKey, rAddress })
        localStorage.setItem('pubkeyAddress', JSON.stringify({ ...items, [account]: rAddress }))
        setPubkey({ ...items, [account]: rAddress })

      } catch (err) {
        setAlert(`
          Error with public key: ${err.message} `
        );
      }


    }
  }, [account])



  const authoriseOneTokenAmount = async (token, amount) => {
    setAlert(`Metamask will now pop up to allow the Verus Bridge Contract to spend ${amount}(${token.name}) from your Goerli balance.`);

    const tokenERC = verusTokens.find(add => add.iaddress === token.value).erc20address;
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

    const approve = await tokenInstContract.approve(DELEGATOR_ADD, bigAmount.toString(), { from: account, gasLimit: maxGas2 })

    setAlert(`Authorising ERC20 Token, please wait...`);
    const reply = await approve.wait();

    if (reply.status === 0) {
      throw new Error("Authorising ERC20 Token Spend Failed, please check your balance.")
    }
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
      const result = getConfigOptions({ ...values, poolAvailable, GASPrice, auxDest: pubkey[account] });

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
          destination: { destinationtype, destinationaddress }, // destination address currency is going to
          destcurrencyid: destinationcurrency,   // destination currency is vrsc on direct. bridge.veth on bounceback
          destsystemid: "0x0000000000000000000000000000000000000000",     // destination system not used 
          secondreserveid    // used as return currency type on bounce back
        }

        if (currencyIaddress === secondreserveid) {
          throw new Error('Cannot bounceback to same currency');
        }

        const { BN } = web3.utils;
        let MetaMaskFee = new BN(web3.utils.toWei(ETH_FEES.ETH, 'ether'));
        // eslint-disable-next-line
        if (destinationtype & FLAG_DEST_GATEWAY) {
          MetaMaskFee = MetaMaskFee.add(new BN(GASPrice.WEICOST)); // bounceback fee
          if (!pubkey[account]) {
            throw new Error('No Refund address present.');
          }
        }

        if (token.value === GLOBAL_ADDRESS.ETH) {
          MetaMaskFee = MetaMaskFee.add(new BN(web3.utils.toWei(amount, 'ether')));
        }

        const timeoutDuration = 240000; // 240 seconds

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Transaction timeout exceeded."));
          }, timeoutDuration);
        });

        const txResult = await delegatorContract.sendTransfer(
          CReserveTransfer,
          { from: account, gasLimit: maxGas, value: MetaMaskFee.toString() }
        );

        const promiseRace = await Promise.race([txResult.wait(), timeoutPromise]);

        if (promiseRace instanceof Error) {
          throw new Error('Transaction timed out');
        }

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
              Last Confirmed VerusTest height: <b>{verusTestHeight > 1 ? verusTestHeight : "-"}</b>
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
            {verusTestHeight > 0 && (<TokenField
              control={control}
              poolAvailable={poolAvailable}
            />)}
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
            <LoadingButton loading={isTxPending} disabled={!verusTokens || !token?.value || isTxPending} type="submit" color="primary" variant="contained">Send</LoadingButton>
          </Box>
        </Grid>
      </form>
    </>
  );
}
