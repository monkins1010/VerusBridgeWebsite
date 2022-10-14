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
  const TOKEN_ETH_NFT_DEFINITION = 128;

  const getNFTs = async () => {

    const tokens = await tokenManagerContract.getTokenList();
    // eslint-disable-next-line
    const TOKEN_OPTIONS = tokens.map(e => ({ label: e.name, value: e.tokenID, iaddress: e.iaddress, erc20address: e.erc20ContractAddress, flags: e.flags })).filter(nft => nft.flags & TOKEN_ETH_NFT_DEFINITION)
    return TOKEN_OPTIONS
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
