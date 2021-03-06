import React from 'react'

import { useWeb3React } from '@web3-react/core';
import Web3 from 'web3';

import ERC20_ABI from 'abis/ERC20Abi.json';
import VERUS_BRIDGE_STORAGE_ABI from 'abis/VerusBridgeStorageAbi.json';
import VERUS_UPGRADE_ABI from 'abis/VerusUpgradeAbi.json';
import InputControlField from 'components/InputControlField'
import { GLOBAL_ADDRESS, BRIDGE_STORAGE_ADD, USDC_ERC20ADD, UPGRADE_ADD } from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { getMaxAmount } from 'utils/contract';

const AmountField = ({ control, selectedToken }) => {
  const verusBridgeStorageContract = useContract(BRIDGE_STORAGE_ADD, VERUS_BRIDGE_STORAGE_ABI);
  const verusUpgradeContract = useContract(UPGRADE_ADD, VERUS_UPGRADE_ABI);
  const USDCContract = useContract(USDC_ERC20ADD, ERC20_ABI);
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

    if (value === GLOBAL_ADDRESS.USDC) {
      const maxAmount = await getMaxAmount(USDCContract, account);
      if (maxAmount < amount) {
        return `Amount is not available in your wallet. ${maxAmount} ${name}`
      }
      return true;
    }

    if (value === GLOBAL_ADDRESS.USDC) {
      const MAPPED_DATA = await verusBridgeStorageContract.verusToERC20mapping(GLOBAL_ADDRESS[name])
      const tokenManagerAddress = await verusUpgradeContract.contracts(TOKEN_MANAGER_ENUM);

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
