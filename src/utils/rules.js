
export const isRAddress = (address) => !!(/^R[1-9A-HJ-NP-Za-km-z]{33,34}$/).test(address);
export const isiAddress = (address) => !!(/^i[1-9A-HJ-NP-Za-km-z]{33,34}$/).test(address);

export const isETHAddress = (address) => {
  if (!(/^(0x)?[0-9a-f]{40}$/i).test(address)) {
    // check if it has the basic requirements of an address
    return false
  } 
  
  if ((/^(0x)?[0-9a-f]{40}$/).test(address) || (/^(0x)?[0-9A-F]{40}$/).test(address)) {
    // If it's all small caps or all all caps, return true
    return true
  }
  
  return false
}

export const validateAddress = (address) => {
  if (isiAddress(address) || isRAddress(address) || isETHAddress(address)) {
    true
  } else {
    return 'Address is not valid'
  }
}
  
