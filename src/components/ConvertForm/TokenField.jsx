import React, { useState, useEffect } from 'react';

import { useWeb3React } from '@web3-react/core';

import TOKEN_MANAGER_ABI from 'abis/TokenManagerAbi.json';
import SelectControlField from 'components/SelectControlField'
import { TOKEN_MANAGER_ADD } from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getTokenOptions } from 'utils/options'



const TokenField = ({ control, poolAvailable }) => {
  const [verusTokens, setVerusTokens] = useState(['']);
  const tokenManagerContract = useContract(TOKEN_MANAGER_ADD, TOKEN_MANAGER_ABI);
  const { account } = useWeb3React();

  const getTokens = async () => {

    const tokens = await tokenManagerContract.getTokenList();
    const TOKEN_OPTIONS2 = tokens.map(e => ({ label: e.name, value: e.ticker }))
    return TOKEN_OPTIONS2
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


  return (<SelectControlField
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
