import React from 'react'

import { useWeb3React } from '@web3-react/core';

import ERC20_ABI from 'abis/ERC20Abi.json';
import TOKEN_MANAGER_ABI from 'abis/TokenManagerAbi.json';
import InputControlField from 'components/InputControlField'
import { ETH_ERC20ADD, GLOBAL_ADDRESS, TOKEN_MANAGERE_RC20ADD, USDC_ERC20ADD } from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getMaxAmount } from 'utils/contract';


const AmountField = ({ control, selectedToken }) => {
  const tokenManInstContract = useContract(TOKEN_MANAGERE_RC20ADD, TOKEN_MANAGER_ABI);
  const ETHContract = useContract(ETH_ERC20ADD, ERC20_ABI);
  const USDCContract = useContract(USDC_ERC20ADD, ERC20_ABI);
   const { account } = useWeb3React();

  const validate = async (amount) => {
    if(amount > 100000) {
      return 'Amount too large. Try a smaller amount.'
    }

    if(amount <= 0) {
      return 'Amount is not valid.'
    }

    if(['USDC', 'ETH'].includes(selectedToken)) {
      const maxAmount = await getMaxAmount(selectedToken === 'ETH' ? ETHContract : USDCContract, account);
      if(maxAmount < amount) {
        return `Amount is not available in your wallet. ${maxAmount} ${selectedToken}`
      }
      return true;
    } 
    
    if(['VRSCTEST', 'BRIDGE'].includes(selectedToken)) {
      const VRSCTEST_ADD = await tokenManInstContract.verusToERC20mapping(GLOBAL_ADDRESS[selectedToken])
      const maxAmount = await getMaxAmount(tokenManInstContract, VRSCTEST_ADD);
      if(maxAmount < amount) {
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
