import React from 'react'

import { useWeb3React } from '@web3-react/core';
import Web3 from 'web3';

import DELEGATOR_ABI from 'abis/DelegatorAbi.json';
import ERC20_ABI from 'abis/ERC20Abi.json';
import InputControlField from 'components/InputControlField'
import { GLOBAL_ADDRESS, DELEGATOR_ADD, FLAGS } from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getMaxAmount, getContract } from 'utils/contract';

const AmountField = ({ control, selectedToken }) => {
  const delegatorContract = useContract(DELEGATOR_ADD, DELEGATOR_ABI);
  const { account, library } = useWeb3React();
  const { value, name } = selectedToken || {};

  const validate = async (amount) => {
    if (amount > 100000000) {
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

    const MAPPED_DATA = await delegatorContract.callStatic.verusToERC20mapping(value)
    // eslint-disable-next-line
    if (parseInt(MAPPED_DATA.flags & FLAGS.MAPPING_ERC20_DEFINITION) > 0) {
      const tokenInstContract = getContract(MAPPED_DATA.erc20ContractAddress, ERC20_ABI, library, account)
      const maxAmount = await getMaxAmount(tokenInstContract, account);
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
