import React, { useEffect, useState } from 'react';

import { LoadingButton } from '@mui/lab';
import { Alert, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Box } from '@mui/system';
import { useWeb3React } from '@web3-react/core';
import { useForm } from 'react-hook-form';
import web3 from 'web3';

import DELEGATOR_ABI from 'abis/DelegatorAbi.json';
import ERC1155_ABI from 'abis/ERC1155.json';
import ERC721_ABI from 'abis/ERC721Abi.json';
import {
  DELEGATOR_ADD,
  ETH_FEES,
  GLOBAL_ADDRESS,
  FLAGS,
  ETHEREUM_BLOCKCHAIN_NAME,
  HEIGHT_LOCATION_IN_FORKS
} from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getContract } from 'utils/contract';
import { convertVerusAddressToEthAddress } from "utils/convert";
import { NFTAddressType } from 'utils/rules';

import AddressField from './NFTAddressField';
import NFTAmountField from './NFTAmountField';
import NFTField from './NFTField';
import { useToast } from '../Toast/ToastProvider';

const maxGas = 6000000;
const maxGas2 = 100000;

export default function NFTForm() {
  const [poolAvailable, setPoolAvailable] = useState(false);
  const [isTxPending, setIsTxPending] = useState(false);
  const [alert, setAlert] = useState(null);
  const [verusChainHeight, setverusChainHeight] = useState(null);
  const { addToast } = useToast();
  const { account, library } = useWeb3React();
  const delegatorContract = useContract(DELEGATOR_ADD, DELEGATOR_ABI);

  const { handleSubmit, control, watch } = useForm({
    mode: 'all'
  });
  const selectedToken = watch('nft');
  const address = watch('address');

  const checkBridgeLaunched = async (contract) => {
    try {

      const pool = await contract.callStatic.bridgeConverterActive();
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

  useEffect(() => {
    if (delegatorContract && account) {
      checkBridgeLaunched(delegatorContract);
    }
  }, [delegatorContract, account])


  const authorise721NFT = async (nft) => {
    setAlert(`Metamask will now pop up to allow the Verus Bridge Contract to transfer (${nft.name}) from your wallet.`);

    const tokenERC = nft.erc20address // await verusBridgeStorageContract.getERCMapping(GLOBAL_ADDRESS[token])
    const NFTInstContract = getContract(tokenERC, ERC721_ABI, library, account)

    const tokenID = `0x${web3.utils.padLeft(nft.value.toHexString().slice(2), 64)}`


    // await NFTInstContract.approve(bridgeStorageAddress, tokenID, { from: account, gasLimit: maxGas2 })
    const approve = await NFTInstContract.approve(DELEGATOR_ADD, tokenID, { from: account, gasLimit: maxGas2 })
    setAlert(`Authorising, please wait... (${nft.name})`);
    const reply = await approve.wait();

    if (reply.status === 0) {
      throw new Error("Authorising NFT spend Failed, Do you own the NFT?")
    }
    setAlert(`
      Your ${ETHEREUM_BLOCKCHAIN_NAME} account has authorised the bridge to transfer your NFT.`
    );
    return tokenID;
  }

  const authorise1155NFT = async (nft, amount) => {
    setAlert(`Metamask will now pop up to allow the Verus Bridge Contract to transfer (${nft.name}) from your wallet.`);

    const tokenERC = nft.erc20address
    const NFTInstContract = getContract(tokenERC, ERC1155_ABI, library, account)

    let nftcontract;

    try {

      nftcontract = await delegatorContract.callStatic.contracts(11);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      nftcontract = DELEGATOR_ADD;
    }

    const tokenID = `0x${web3.utils.padLeft(nft.value.toHexString().slice(2), 64)}`

    const checkApproved = await NFTInstContract.callStatic.isApprovedForAll(account, nftcontract);
    const amountOfNFTs = await NFTInstContract.callStatic.balanceOf(account, tokenID);

    if (amountOfNFTs < amount) {
      throw new Error(`You do not have enough NFT's to send. You have ${amountOfNFTs} and you are trying to send ${amount}.`)

    }
    // await NFTInstContract.approve(bridgeStorageAddress, tokenID, { from: account, gasLimit: maxGas2 })

    if (!checkApproved) {
      const approve = await NFTInstContract.setApprovalForAll(nftcontract, true, { from: account, gasLimit: maxGas2 })
      setAlert(`Authorising, please wait... (${nft.name})`);
      const reply = await approve.wait();

      if (reply.status === 0) {
        throw new Error("Authorising NFT spend Failed, Do you own the NFT?")
      }
      setAlert(`
        Your ${ETHEREUM_BLOCKCHAIN_NAME} account has authorised the bridge to transfer your NFT.`
      );
    }
    return tokenID;
  }

  const onSubmit = async (values) => {
    const { nft, amount, address } = values;
    setAlert(null);
    setIsTxPending(true);

    let amountToSend;

    try {
      // eslint-disable-next-line
      if (parseInt(nft.flags & FLAGS.MAPPING_ERC721_NFT_DEFINITION) == FLAGS.MAPPING_ERC721_NFT_DEFINITION) {
        await authorise721NFT(nft)
        amountToSend = 1;
      } else {
        await authorise1155NFT(nft, amount);
        amountToSend = amount || 1;
      }
      const addressType = NFTAddressType(address);
      const hexID = convertVerusAddressToEthAddress(address);
      const CReserveTransfer = {
        version: 1,
        currencyvalue: { currency: nft.iaddress, amount: amountToSend }, // currency sending from ethereum
        flags: 1,
        feecurrencyid: poolAvailable ? GLOBAL_ADDRESS.ETH : GLOBAL_ADDRESS.VRSC, // fee is vrsc pre bridge launch, veth or others post.
        fees: poolAvailable ? ETH_FEES.SATS : ETH_FEES.VRSC_SATS_FEE,
        destination: { destinationtype: addressType, destinationaddress: hexID }, // destination address currecny is going to
        destcurrencyid: poolAvailable ? GLOBAL_ADDRESS.BETH : GLOBAL_ADDRESS.VRSC,   // destination currency is vrsc on direct. bridge.veth on bounceback
        destsystemid: "0x0000000000000000000000000000000000000000",     // destination system not used 
        secondreserveid: "0x0000000000000000000000000000000000000000"    // used as return currency type on bounce back
      }

      const { BN } = web3.utils;
      const MetaMaskFee = new BN(web3.utils.toWei(ETH_FEES.ETH, 'ether'));

      const txResult = await delegatorContract.sendTransfer(
        CReserveTransfer,
        { from: account, gasLimit: maxGas, value: MetaMaskFee.toString() }
      );
      await txResult.wait();

      addToast({ type: "success", description: 'Transaction Success!' });
      setAlert(null);
      setIsTxPending(false);
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
            <NFTField
              control={control}
              poolAvailable={poolAvailable}
            />
          </Grid>
          { /* eslint-disable-next-line */}
          {(parseInt(selectedToken?.flags & FLAGS.MAPPING_ERC1155_ERC_DEFINITION) == FLAGS.MAPPING_ERC1155_ERC_DEFINITION) && (
            <Grid item xs={12}>
              <NFTAmountField
                control={control}
                selectedToken={selectedToken}
              />
            </Grid>
          )}
          <Box mt="30px" textAlign="center" width="100%">
            <LoadingButton loading={isTxPending} disabled={!address || !selectedToken?.value} type="submit" color="primary" variant="contained">Send</LoadingButton>
          </Box>
        </Grid>
      </form>
    </>
  );
}
