import React, { useEffect, useState } from 'react';

import { address as baddress, crypto as bcrypto } from '@bitgo/utxo-lib';
import { LoadingButton } from '@mui/lab';
import { Alert, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Box } from '@mui/system';
import { useWeb3React } from '@web3-react/core';
import { utils } from 'ethers'
import { useForm } from 'react-hook-form';
import { VerusdRpcInterface } from 'verusd-rpc-ts-client'
import web3 from 'web3';

import DELEGATOR_ABI from 'abis/DelegatorAbi.json';
import ERC20_ABI from 'abis/ERC20Abi.json';
import {
  DELEGATOR_ADD,
  GLOBAL_ADDRESS,
  ETH_FEES,
  GLOBAL_IADDRESS,
  BLOCKCHAIN_NAME,
  ETHEREUM_BLOCKCHAIN_NAME,
  HEIGHT_LOCATION_IN_FORKS
} from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getContract } from 'utils/contract';
import { validateAddress, coinsToSats } from 'utils/rules'
import { getConfigOptions } from 'utils/txConfig';

import AddressField from './AddressField';
import AmountField from './AmountField';
import DestinationField from './DestinationField';
import TokenField from './TokenField';
import bitGoUTXO from '../../utils/bitUTXO';
import { useToast } from '../Toast/ToastProvider';

const maxGas = 1000000;
const maxGas2 = 100000;
const FLAG_DEST_GATEWAY = 128;
const { GAS_TRANSACTIONIMPORTFEE, MINIMUM_GAS_PRICE_WEI } = ETH_FEES;

export default function TransactionForm() {
  const [poolAvailable, setPoolAvailable] = useState(false);
  const [isTxPending, setIsTxPending] = useState(false);
  const [alert, setAlert] = useState(null);
  const [verusChainHeight, setverusChainHeight] = useState(null);
  const [currentOptionsPrices, setcurrentOptionsPrices] = useState(null);
  // const [dollarsOutcome, setdollarsOutcome] = useState(null);
  const [verusTokens, setVerusTokens] = useState(['']);
  const [GASPrice, setGASPrice] = useState("");
  const { addToast } = useToast();
  const { account, library } = useWeb3React();
  const delegatorContract = useContract(DELEGATOR_ADD, DELEGATOR_ABI);

  const verusd = new VerusdRpcInterface(GLOBAL_IADDRESS.VRSC, process.env.REACT_APP_VERUS_RPC_URL)

  const [pubkey, setPubkey] = useState('');

  const { handleSubmit, control, watch } = useForm({
    mode: 'all'
  });
  const selectedToken = watch('token');
  const address = watch('address');
  const token = watch('token');
  const destination = watch('destination');
  const amount = watch('amount');

  const getArticlesFromApi = async () => {

    const latestBlock = await library.getBlockNumber();
    let block = await library.getBlock(latestBlock - 10);
    if (block.transactions.length < 1) {
      block = await library.getBlock(latestBlock - 11);
    }
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
      const heightPos = HEIGHT_LOCATION_IN_FORKS;
      const heightHex = parseInt(`0x${forksData.substring(heightPos, heightPos + 8)}`, 16);
      setverusChainHeight(heightHex || 1);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      setverusChainHeight(1);
    }
  }

  const getTokens = async () => {

    const tokens = await delegatorContract.callStatic.getTokenList(0, 0);
    const TOKEN_OPTIONS = tokens.map(e => ({ label: e.name, value: e.ticker, iaddress: e.iaddress, erc20address: e.erc20ContractAddress }))
    return TOKEN_OPTIONS
  }

  useEffect(async () => {
    if (selectedToken && destination && amount !== "0") {

      const currencies = {
        [BLOCKCHAIN_NAME]: bitGoUTXO.address.toBase58Check(Buffer.from(GLOBAL_ADDRESS.VRSC.slice(2), 'hex'), 102),
        "bridgeBRIDGE": bitGoUTXO.address.toBase58Check(Buffer.from(GLOBAL_ADDRESS.BETH.slice(2), 'hex'), 102),
        "bridgeVRSC": bitGoUTXO.address.toBase58Check(Buffer.from(GLOBAL_ADDRESS.VRSC.slice(2), 'hex'), 102),
        "bridgeETH": bitGoUTXO.address.toBase58Check(Buffer.from(GLOBAL_ADDRESS.ETH.slice(2), 'hex'), 102),
        "bridgeDAI": bitGoUTXO.address.toBase58Check(Buffer.from(GLOBAL_ADDRESS.DAI.slice(2), 'hex'), 102),
        "bridgeMKR": bitGoUTXO.address.toBase58Check(Buffer.from(GLOBAL_ADDRESS.MKR.slice(2), 'hex'), 102)
      }

      const fromIaddress = bitGoUTXO.address.toBase58Check(Buffer.from(selectedToken.value.slice(2), 'hex'), 102);

      const convertedto = poolAvailable ? currencies[destination] : currencies.bridgeBRIDGE;

      const conversionPacket = { currency: fromIaddress, convertto: convertedto, amount };

      if (convertedto !== GLOBAL_IADDRESS.BETH && fromIaddress !== GLOBAL_IADDRESS.BETH && poolAvailable) {
        conversionPacket.via = GLOBAL_IADDRESS.BETH;
      }

      if (Object.keys(GLOBAL_ADDRESS).map((key) => GLOBAL_ADDRESS[key]).indexOf(selectedToken.value) > -1) {
        const estimation = await verusd.estimateConversion(conversionPacket);

        if (estimation?.result?.estimatedcurrencyout > 0 && destination !== BLOCKCHAIN_NAME) {

          const currency = await verusd.getCurrency(convertedto);

          setcurrentOptionsPrices({ value: `${estimation.result.estimatedcurrencyout}`, destination: currency.result.fullyqualifiedname });

          if (poolAvailable) {
            // todo get price from api.

          }

        } else {
          setcurrentOptionsPrices(null);
        }
      }

    } else {
      setcurrentOptionsPrices(null);
    }
  }, [selectedToken, destination, amount])

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
        const compressed = utils.computePublicKey(publicKey, true)
        const check = bcrypto.hash160(Buffer.from(compressed.slice(2), 'hex'));
        const rAddress = baddress.toBase58Check(check, 60)
        // const rAddress = ECPair.fromPublicKeyBuffer(Buffer.from(compressed.slice(2), 'hex'), networks.verustest).getAddress()

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
    setAlert(`Metamask will now pop up to allow the Verus Bridge Contract to spend ${amount}(${token.name}) from your ${ETHEREUM_BLOCKCHAIN_NAME} balance.`);

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
      Your ${ETHEREUM_BLOCKCHAIN_NAME} account has authorised the bridge to spend ${token.name} token, the amount: ${amount}. 
      \n Next, after this window please check the amount in Meta mask is what you wish to send.`
    );
  }

  const onSubmit = async (values) => {
    const { token, amount } = values;
    setAlert(null);
    setIsTxPending(true);
    const validAccount = await validateAddress(account);
    if (validAccount !== true) {
      addToast({ type: "error", description: 'Sending Account invalid' })
      setAlert(null);
      setIsTxPending(false);
      return;
    }

    try {
      if (token?.value !== GLOBAL_ADDRESS.ETH) {
        await authoriseOneTokenAmount(token, amount);
      }
      const result = getConfigOptions({ ...values, poolAvailable, GASPrice, auxDest: pubkey[account] });

      if (result) {
        const { flagvalue, feecurrency, fees, destinationtype, destinationaddress, destinationcurrency, secondreserveid } = result;
        const verusAmount = coinsToSats(amount);
        const currencyIaddress = token.value;
        const CReserveTransfer = {
          version: 1,
          currencyvalue: { currency: currencyIaddress, amount: verusAmount }, // currency sending from ethereum
          flags: flagvalue,
          feecurrencyid: feecurrency, // fee is vrsc pre bridge launch, veth or others post.
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
              Last Confirmed Verus height: <b>{verusChainHeight > 1 ? verusChainHeight : "-"}</b>
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
            {verusChainHeight > 0 && (<TokenField
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
            {currentOptionsPrices ? (<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Typography style={{ fontSize: '12px', color: 'grey' }}>
                <b>{`${parseFloat(currentOptionsPrices.value) < 0.001 ? parseFloat(currentOptionsPrices.value).toFixed(8) : parseFloat(currentOptionsPrices.value).toFixed(3)}`}</b>
              </Typography>
              <Typography style={{ fontSize: '11px', color: 'grey', padding: '0 5px' }}>
                {`${currentOptionsPrices.destination}`}
              </Typography>
            </div>) : null}
          </Grid>
          <Box mt="30px" textAlign="center" width="100%">
            <LoadingButton loading={isTxPending} disabled={!verusTokens || !token?.value || isTxPending} type="submit" color="primary" variant="contained">Send</LoadingButton>
          </Box>
        </Grid>
      </form>
    </>
  );
}
