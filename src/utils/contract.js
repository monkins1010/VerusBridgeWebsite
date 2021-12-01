import { getAddress } from '@ethersproject/address';
import { AddressZero } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value) {
  try {
    return getAddress(value);
  } catch {
    return false;
  }
}


// account is not optional
export function getSigner(library, account) {
  return library.getSigner(account).connectUnchecked();
}

export function getProviderOrSigner(
  library,
  account
) {
  return account ? getSigner(library, account) : library;
}

// account is optional
export function getContract(
  address,
  ABI,
  library,
  account
) {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }

  return new Contract(address, ABI, getProviderOrSigner(library, account));
}

export const getMaxAmount = async (USDCContract, account) => {
  const usdcPrice = await USDCContract.balanceOf(account);
  const decimals = await USDCContract.decimals();
  const usdcBalance = parseInt(usdcPrice.toString(), 10) / (10 ** decimals);

  return usdcBalance;
}
