import BigNumber from 'bignumber.js';

export const isRAddress = (address) => (/^R[1-9A-HJ-NP-Za-km-z]{33,34}$/).test(address);
export const isiAddress = (address) => (/^i[1-9A-HJ-NP-Za-km-z]{33,34}$/).test(address);

export const isETHAddressAsync = async (address) => {
  const response = await fetch('./exclude.json');
  let excludeFound = true;
  try {
    const excludeList = await response.json();
    excludeFound = excludeList?.ETH.findIndex(element => {
      return element.toLowerCase() === address.toLowerCase();
    }) === -1;
  } catch (e) {

  }

  const ETHPassesRegex = (/^(0x)?[0-9a-fA-F]{40}$/).test(address);
  const retval = excludeFound && ETHPassesRegex;
  return retval;
}

export const isETHAddress = (address) => {
  const ETHPassesRegex = (/^(0x)?[0-9a-fA-F]{40}$/).test(address);
  return ETHPassesRegex;
}

export const validateAddress = async (address) => {

  if (isiAddress(address) || isRAddress(address) || await isETHAddressAsync(address)) {
    return true
  } else {
    return 'Address is not valid'
  }

}

export const validateNFTAddress = (address) => {
  if (isiAddress(address) || isRAddress(address)) {
    return true
  } else {
    return 'Address is not valid'
  }
}

export const NFTAddressType = (address) => {
  if (isiAddress(address))
    return "04";
  else if (isRAddress(address))
    return "02";
  else
    return 'Address is not valid'

}

export const validateClaimAddress = (address, usePublicKey) => {

  if (usePublicKey) {
    return true;
  } if (isiAddress(address) || isRAddress(address)) {
    return true
  } else {
    return 'Address is not valid'
  }
}

export const uint64ToVerusFloat = (number) => {

  const input = BigInt(number);
  let inter = `${(input / BigInt(100000000))}.`
  let decimalp = `${(input % BigInt(100000000))}`

  if (input < 0) {
    inter = `-${inter}`;
    decimalp = decimalp.slice(1);
  }

  while (decimalp.length < 8) {
    decimalp = `0${decimalp}`;
  }
  return (inter + decimalp)
}

export const coinsToUnits = (coin, decimals) => {
  return coin.multipliedBy(BigNumber(10).pow(BigNumber(decimals)))
}

export const coinsToSats = (coins) => {
  BigNumber.set({ EXPONENTIAL_AT: 1000000, ROUNDING_MODE: BigNumber.ROUND_FLOOR });
  let input = BigNumber(coins);

  return BigNumber(coinsToUnits(input, 8).toFixed(0)).toString();
}
