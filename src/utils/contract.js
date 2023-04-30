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

export const getMaxAmount = async (DAIContract, account) => {
  const DAIPrice = await DAIContract.balanceOf(account);
  const decimals = await DAIContract.decimals();
  const DAIBalance = parseInt(DAIPrice.toString(), 10) / (10 ** decimals);

  return DAIBalance;
}
