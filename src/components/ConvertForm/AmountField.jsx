import React from 'react'

import { useWeb3React } from '@web3-react/core';
import Web3 from 'web3';

import ERC20_ABI from 'abis/ERC20Abi.json';
import TOKEN_MANAGER_ABI from 'abis/TokenManagerAbi.json';
import InputControlField from 'components/InputControlField'
import { GLOBAL_ADDRESS, TOKEN_MANAGER_ERC20, USDC_ERC20ADD } from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getMaxAmount } from 'utils/contract';

const AmountField = ({ control, selectedToken }) => {
  const tokenManInstContract = useContract(TOKEN_MANAGER_ERC20, TOKEN_MANAGER_ABI);
  const USDCContract = useContract(USDC_ERC20ADD, ERC20_ABI);
  const { account } = useWeb3React();

  const validate = async (amount) => {
    if (amount > 100000) {
      return 'Amount too large. Try a smaller amount.'
    }

    if (amount <= 0) {
      return 'Amount is not valid.'
    }

    if (selectedToken === 'ETH') {
      const web3 = new Web3(window.ethereum);
      window.ethereum.enable();
      let accbal = await web3.eth.getBalance(account);
      accbal = web3.utils.fromWei(accbal);
      accbal = parseFloat(accbal);
      if (accbal < amount) {
        return `Amount is not available in your wallet. ${accbal} ${selectedToken}`
      }
      return true;
    }

    if (selectedToken === 'USDC') {
      const maxAmount = await getMaxAmount(USDCContract, account);
      if (maxAmount < amount) {
        return `Amount is not available in your wallet. ${maxAmount} ${selectedToken}`
      }
      return true;
    }

    if (['VRSCTEST', 'BRIDGE'].includes(selectedToken)) {
      const VRSCTEST_ADD = await tokenManInstContract.verusToERC20mapping(GLOBAL_ADDRESS[selectedToken])
      const maxAmount = await getMaxAmount(tokenManInstContract, VRSCTEST_ADD);
      if (maxAmount < amount) {
        return `Amount is not available in your wallet. ${maxAmount} ${selectedToken}`
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
      type="number"
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
