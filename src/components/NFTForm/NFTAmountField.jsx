import React from 'react'

import { useWeb3React } from '@web3-react/core';
import web3 from 'web3';

import ERC1155_ABI from 'abis/ERC1155.json';
import InputControlField from 'components/InputControlField'
import { getContract } from 'utils/contract';


const NFTAmountField = ({ control, selectedToken }) => {

  const { account, library } = useWeb3React();
  const { value, name, erc20address } = selectedToken || {};

  const validate = async (amount) => {
    if (amount > 100000) {
      return 'Amount too large. Try a smaller amount.'
    }

    if (amount <= 0) {
      return 'Amount is not valid.'
    }

    const NFTInstContract = getContract(erc20address, ERC1155_ABI, library, account);
    const tokenID = `0x${web3.utils.padLeft(value.toHexString().slice(2), 64)}`
    const NFTBalance = await NFTInstContract.callStatic.balanceOf(account, tokenID);
    const BNAmount = new web3.utils.BN(amount, 10);
    const BNNFTBalance = new web3.utils.BN(NFTBalance.toString(), 10);
    if (BNNFTBalance.lt(BNAmount)) {
      return `You only have ${NFTBalance} ${name}'s in your wallet`
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

export default NFTAmountField
