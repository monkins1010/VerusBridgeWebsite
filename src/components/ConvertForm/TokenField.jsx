import React, { useState, useEffect } from 'react';

import { useWeb3React } from '@web3-react/core';

import TOKEN_MANAGER_ABI from 'abis/TokenManagerAbi.json';
import AutocompleteControlField from 'components/AutocompleteControlField'
import { TOKEN_MANAGER_ADD } from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getTokenOptions } from 'utils/options'



const TokenField = ({ control, poolAvailable }) => {
  const [verusTokens, setVerusTokens] = useState(['']);
  const tokenManagerContract = useContract(TOKEN_MANAGER_ADD, TOKEN_MANAGER_ABI);
  const { account } = useWeb3React();
  const TOKEN_ETH_NFT_DEFINITION = 128;
  const getTokens = async () => {

    const tokens = await tokenManagerContract.getTokenList();
    // eslint-disable-next-line
    const tokenList = tokens.map(e => ({ label: e.name, value: e.iaddress, flags: e.flags })).filter(token => !(token.flags & TOKEN_ETH_NFT_DEFINITION) && token.label)
    return tokenList
  }

  useEffect(async () => {

    if (tokenManagerContract && account) {
      let tokens = await getTokens();
      // REMOVE BELOW DEBUG
      // tokens.push({ value: "CRS", label: "chriscoin" })
      tokens = getTokenOptions(poolAvailable, tokens);

      setVerusTokens(tokens);
    }
  }, [tokenManagerContract, account])


  return (<AutocompleteControlField
    name="token"
    id="token"
    label="Token"
    fullWidth
    variant="standard"
    defaultValue=""
    control={control}
    options={verusTokens}
    rules={{
      required: 'Address is required'
    }}
  />)

}
export default TokenField
