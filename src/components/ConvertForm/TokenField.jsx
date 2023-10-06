import React, { useState, useEffect } from 'react';

import { useWeb3React } from '@web3-react/core';

import DELEGATOR_ABI from 'abis/DelegatorAbi.json';
import AutocompleteControlField from 'components/AutocompleteControlField'
import { DELEGATOR_ADD, FLAGS } from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getTokenOptions } from 'utils/options'

import bitGoUTXO from '../../utils/bitUTXO';

const TokenField = ({ control, poolAvailable, token }) => {
  const [verusTokens, setVerusTokens] = useState(['']);
  const delegatorContract = useContract(DELEGATOR_ADD, DELEGATOR_ABI);
  const { account } = useWeb3React();
  const getTokens = async () => {

    const tokens = await delegatorContract.callStatic.getTokenList(0, 0);
    // eslint-disable-next-line
    const tokenList = tokens.map(e => ({
      label: e.name,
      value: e.iaddress,
      id: bitGoUTXO.address.toBase58Check(Buffer.from(e.iaddress.slice(2), 'hex'), 102), flags: e.flags
    }))
      // eslint-disable-next-line
      .filter(token => (token.flags & FLAGS.MAPPING_ERC20_DEFINITION) && token.label)
    return tokenList
  }

  useEffect(async () => {

    if (delegatorContract && account) {
      let tokens = await getTokens();

      tokens = getTokenOptions(poolAvailable, tokens);
      setVerusTokens(tokens);
    }
  }, [delegatorContract, account])


  return (<AutocompleteControlField
    name="token"
    id="token"
    label={token || "Token"}
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
