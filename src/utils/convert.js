import bitGoUTXO from './bitUTXO';

export const convertVerusAddressToEthAddress = (verusAddress) => {
  const address = bitGoUTXO.address.fromBase58Check(verusAddress, 102).hash.toString('hex')
  return `0x${address}`
}