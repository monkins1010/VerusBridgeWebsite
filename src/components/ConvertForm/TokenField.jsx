import React, { useState, useEffect } from 'react';

import { useWeb3React } from '@web3-react/core';

import DELEGATOR_ABI from 'abis/DelegatorAbi.json';
import AutocompleteControlField from 'components/AutocompleteControlField'
import { DELEGATOR_ADD, FLAGS } from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getTokenOptions } from 'utils/options'

const TokenField = ({ control, poolAvailable }) => {
  const [verusTokens, setVerusTokens] = useState(['']);
  const delegatorContract = useContract(DELEGATOR_ADD, DELEGATOR_ABI);
  const { account } = useWeb3React();
  const getTokens = async () => {

    const tokens = await delegatorContract.callStatic.getTokenList(0, 0);
    // eslint-disable-next-line
    const tokenList = tokens.map(e => ({ label: e.name, value: e.iaddress, flags: e.flags })).filter(token => (token.flags & FLAGS.MAPPING_ERC20_DEFINITION) && token.label)
    return tokenList
  }

  useEffect(async () => {

    if (delegatorContract && account) {
      let tokens = await getTokens();
      // REMOVE BELOW DEBUG
      // tokens.push({ value: "CRS", label: "chriscoin" })
      tokens = getTokenOptions(poolAvailable, tokens);

      setVerusTokens(tokens);
    }
  }, [delegatorContract, account])


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
