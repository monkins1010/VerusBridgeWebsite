import React, { useState, useEffect } from 'react';

import { useWeb3React } from '@web3-react/core';

import DELEGATOR_ABI from 'abis/DelegatorAbi.json';
import AutocompleteControlField from 'components/AutocompleteControlField'
import { DELEGATOR_ADD } from 'constants/contractAddress';
import useContract from 'hooks/useContract';

const NFTField = ({ control }) => {
  const [verusNFTS, setVerusNFTS] = useState(['']);
  const delegatorContract = useContract(DELEGATOR_ADD, DELEGATOR_ABI);
  const { account } = useWeb3React();
  const TOKEN_ETH_NFT_DEFINITION = 128;
  const MAPPING_VERUS_OWNED = 2
  const getNFTs = async () => {

    const tokens = await delegatorContract.callStatic.getTokenList(0, 0);
    // eslint-disable-next-line
    const TOKEN_OPTIONS = tokens.map(e => ({ label: e.flags & MAPPING_VERUS_OWNED ? `${e.name}.VerusNFT` : e.name, value: e.tokenID, iaddress: e.iaddress, erc20address: e.erc20ContractAddress, flags: e.flags })).filter(nft => nft.flags & TOKEN_ETH_NFT_DEFINITION)
    TOKEN_OPTIONS[0].label = `VerusNFTs are at (${TOKEN_OPTIONS[0].erc20address})`

    return TOKEN_OPTIONS
  }

  useEffect(async () => {

    if (delegatorContract && account) {
      const nfts = await getNFTs();

      setVerusNFTS(nfts);
    }
  }, [delegatorContract, account])

  return (<AutocompleteControlField
    name="nft"
    id="nft"
    label="NFT"
    fullWidth
    variant="standard"
    defaultValue=""
    control={control}
    options={verusNFTS}
    rules={{
      required: 'Address is required'
    }}
  />)

}
export default NFTField
