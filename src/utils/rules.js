import List from '../files/exclude.json'

export const isRAddress = (address) => (/^R[1-9A-HJ-NP-Za-km-z]{33,34}$/).test(address);
export const isiAddress = (address) => (/^i[1-9A-HJ-NP-Za-km-z]{33,34}$/).test(address);
export const isETHAddress = (address) => {

  const addressFound = List?.ETH ? List.ETH.indexOf(address) > -1 : false;

  return !addressFound && (/^(0x)?[0-9a-fA-F]{40}$/).test(address);

}

export const validateAddress = (address) => {
  if (isiAddress(address) || isRAddress(address) || isETHAddress(address)) {
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

export const validateETHAddress = (address) => {
  if (isETHAddress(address)) {
    return true
  } else {
    return 'Address is not valid'
  }
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

