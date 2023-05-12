import { isETHAddress, isiAddress, isRAddress } from "./rules";
import { FLAGS } from 'constants/contractAddress';
import { GLOBAL_ADDRESS } from 'constants/contractAddress';

export const getTokenOptions = (poolAvailable, tokens) => (
  !poolAvailable ? tokens.filter(option => !(parseInt(option.flags) & 8)) : tokens
)

export const getDestinations = (token, addr) => ([
  { value: "vrsctest", label: `${token ?? 'VRSCTEST'} on VRSCTEST`, iaddress: addr },
  { value: "bridgeBRIDGE", label: "Convert to Bridge.vETH on VRSCTEST", iaddress: GLOBAL_ADDRESS.BETH },
  { value: "bridgeDAI", label: "Convert to DAI on VRSCTEST", iaddress: GLOBAL_ADDRESS.DAI },
  { value: "bridgeVRSCTEST", label: "Convert to VRSCTEST on VRSCTEST", iaddress: GLOBAL_ADDRESS.VRSC },
  { value: "bridgeETH", label: "Convert to ETH on VRSCTEST", iaddress: GLOBAL_ADDRESS.ETH },
  { value: "swaptoBRIDGE", label: "Convert to Bridge.vETH Token (Bounce back to ETH)", iaddress: GLOBAL_ADDRESS.BETH },
  { value: "swaptoVRSC", label: "Convert to VRSCTEST Token (Bounce back to ETH)", iaddress: GLOBAL_ADDRESS.VRSC },
  { value: "swaptoDAI", label: "Convert to DAI Token (Bounce back to ETH)", iaddress: GLOBAL_ADDRESS.DAI },
  { value: "swaptoETH", label: "Convert to ETH (Bounce back to ETH)", iaddress: GLOBAL_ADDRESS.ETH }
]);

const destionationOptionsByPool = [
  "swaptoBRIDGE", "swaptoVRSC", 'bridgeBRIDGE', 'swaptoDAI', 'swaptoETH'
]

export const getDestinationOptions = (poolAvailable, address, selectedToken, tokenName) => {

  const options = !poolAvailable
    ? getDestinations(tokenName, selectedToken).filter(option => !destionationOptionsByPool.includes(option.value))
    : getDestinations(tokenName, selectedToken)

  const addedToken = ![GLOBAL_ADDRESS.DAI, GLOBAL_ADDRESS.VRSC, GLOBAL_ADDRESS.BETH, GLOBAL_ADDRESS.ETH].includes(selectedToken);

  if (isETHAddress(address)) {
    const ethOptions = options.filter(option => !['vrsctest', 'bridgeBRIDGE', 'bridgeDAI', 'bridgeVRSC', 'bridgeETH', 'bridgeVRSCTEST'].includes(option.value));
    if (addedToken) {
      return [] //if its a mapped added token dont offer bounce back
    }
    if (selectedToken) {
      return ethOptions.filter(option => option.iaddress !== selectedToken);
    }
    else {
      return ethOptions
    }
  }

  if (isiAddress(address) || isRAddress(address)) {
    const vscOptions = options.filter(option => ['vrsctest', 'bridgeBRIDGE', 'bridgeDAI', 'bridgeVRSC', 'bridgeETH'].includes(option.value));

    if (!poolAvailable || addedToken) {
      return vscOptions.filter(option => option.value === 'vrsctest')
    } //else {
    // return vscOptions.filter(option => option.iaddress !== selectedToken);
    // }
    if (selectedToken == GLOBAL_ADDRESS.DAI) {
      return [
        { value: "vrsctest", label: 'DAI ON VRSCTEST', iaddress: GLOBAL_ADDRESS.DAI },
        { value: "bridgeBRIDGE", label: "Convert to Bridge.vETH on VRSCTEST", iaddress: GLOBAL_ADDRESS.BETH },
        { value: "bridgeVRSCTEST", label: "Convert to VRSCTEST on VRSCTEST", iaddress: GLOBAL_ADDRESS.VRSC },
        { value: "bridgeETH", label: "Convert to vETH on VRSCTEST", iaddress: GLOBAL_ADDRESS.ETH }
      ]
    }
    else if (selectedToken == GLOBAL_ADDRESS.VRSC) {
      return [
        { value: "vrsctest", label: 'VRSCTEST ON VRSCTEST', iaddress: GLOBAL_ADDRESS.VRSC },
        { value: "bridgeBRIDGE", label: "Convert to Bridge.vETH on VRSCTEST", iaddress: GLOBAL_ADDRESS.BETH },
        { value: "bridgeDAI", label: "Convert to DAI on VRSCTEST", iaddress: GLOBAL_ADDRESS.DAI },
        { value: "bridgeETH", label: "Convert to vETH on VRSCTEST", iaddress: GLOBAL_ADDRESS.ETH }
      ]
    }
    else if (selectedToken == GLOBAL_ADDRESS.BETH) {
      return [
        { value: "vrsctest", label: 'Bridge.vETH ON VRSCTEST', iaddress: GLOBAL_ADDRESS.BETH },
        { value: "bridgeDAI", label: "Convert to DAI on VRSCTEST", iaddress: GLOBAL_ADDRESS.DAI },
        { value: "bridgeVRSCTEST", label: "Convert to VRSCTEST on VRSCTEST", iaddress: GLOBAL_ADDRESS.VRSC },
        { value: "bridgeETH", label: "Convert to vETH on VRSCTEST", iaddress: GLOBAL_ADDRESS.ETH }
      ]
    }
    else if (selectedToken == GLOBAL_ADDRESS.ETH) {
      return [
        { value: "vrsctest", label: 'vETH ON VRSCTEST', iaddress: GLOBAL_ADDRESS.ETH },
        { value: "bridgeBRIDGE", label: "Convert to Bridge.vETH on VRSCTEST", iaddress: GLOBAL_ADDRESS.BETH },
        { value: "bridgeDAI", label: "Convert to DAI on VRSCTEST", iaddress: GLOBAL_ADDRESS.DAI },
        { value: "bridgeVRSCTEST", label: "Convert to VRSCTEST on VRSCTEST", iaddress: GLOBAL_ADDRESS.VRSC }
      ]
    }

    return vscOptions
  }

  return options;
}
