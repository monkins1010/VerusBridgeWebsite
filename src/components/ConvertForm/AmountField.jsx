import React from 'react'

import { useWeb3React } from '@web3-react/core';
import Web3 from 'web3';

import DELEGATOR_ABI from 'abis/DelegatorAbi.json';
import ERC20_ABI from 'abis/ERC20Abi.json';
import InputControlField from 'components/InputControlField'
import { GLOBAL_ADDRESS, DELEGATOR_ADD, DAI_ERC20ADD } from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getMaxAmount } from 'utils/contract';

const AmountField = ({ control, selectedToken }) => {
  const delegatorContract = useContract(DELEGATOR_ADD, DELEGATOR_ABI);
  const DAIContract = useContract(DAI_ERC20ADD, ERC20_ABI);
  const { account } = useWeb3React();
  const TOKEN_MANAGER_ENUM = 0;

  const { value, name } = selectedToken || {};

  const validate = async (amount) => {
    if (amount > 100000) {
      return 'Amount too large. Try a smaller amount.'
    }

    if (amount <= 0) {
      return 'Amount is not valid.'
    }

    if (value === GLOBAL_ADDRESS.ETH) {
      const web3 = new Web3(window.ethereum);
      window.ethereum.enable();
      let accbal = await web3.eth.getBalance(account);
      accbal = web3.utils.fromWei(accbal);
      accbal = parseFloat(accbal);
      if (accbal < amount) {
        return `Amount is not available in your wallet. ${accbal} ${name}`
      }
      return true;
    }

    if (value === GLOBAL_ADDRESS.DAI) {
      const maxAmount = await getMaxAmount(DAIContract, account);
      if (maxAmount < amount) {
        return `Amount is not available in your wallet. ${maxAmount} ${name}`
      }
      return true;
    }

    if (value === GLOBAL_ADDRESS.DAI) {
      const MAPPED_DATA = await delegatorContract.callStatic.getERCMapping(GLOBAL_ADDRESS[name])
      const tokenManagerAddress = await delegatorContract.callStatic.contracts(TOKEN_MANAGER_ENUM);

      const maxAmount = await getMaxAmount(tokenManagerAddress, MAPPED_DATA.erc20ContractAddress);
      if (maxAmount < amount) {
        return `Amount is not available in your wallet. ${maxAmount} ${name}`
      }
      return true;
    }

    return true;
  }
  return (
    <InputControlField
      name="amount"
      label="Amount"
      fullWidth
      variant="standard"
      control={control}
      type="tel"
      defaultValue="0"
      min={0}
      rules={{
        required: 'Amount is required',
        validate
      }}
    />
  )
}

export default AmountField
