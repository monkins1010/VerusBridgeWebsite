import React, { useState, useEffect } from 'react';

import { useWeb3React } from '@web3-react/core';

import TOKEN_MANAGER_ABI from 'abis/TokenManagerAbi.json';
import AutocompleteControlField from 'components/AutocompleteControlField'
import { TOKEN_MANAGER_ADD } from 'constants/contractAddress';
import useContract from 'hooks/useContract';

const NFTField = ({ control }) => {
  const [verusNFTS, setVerusNFTS] = useState(['']);
  const tokenManagerContract = useContract(TOKEN_MANAGER_ADD, TOKEN_MANAGER_ABI);
  const { account } = useWeb3React();

  const getNFTs = async () => {

    const tokens = await tokenManagerContract.getTokenList();
    const tokenList = tokens.map(e => ({ label: e.name, value: e.iaddress, flags: e.flags }))
    return tokenList
  }

  useEffect(async () => {

    if (tokenManagerContract && account) {
      const nfts = await getNFTs();

      setVerusNFTS(nfts);
    }
  }, [tokenManagerContract, account])


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
