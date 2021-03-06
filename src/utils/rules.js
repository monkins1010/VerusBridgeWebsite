
export const isRAddress = (address) => (/^R[1-9A-HJ-NP-Za-km-z]{33,34}$/).test(address);
export const isiAddress = (address) => (/^i[1-9A-HJ-NP-Za-km-z]{33,34}$/).test(address);
export const isETHAddress = (address) => (/^(0x)?[0-9a-fA-F]{40}$/).test(address);

export const validateAddress = (address) => {
  if (isiAddress(address) || isRAddress(address) || isETHAddress(address)) {
    true
  } else {
    return 'Address is not valid'
  }
}
  
