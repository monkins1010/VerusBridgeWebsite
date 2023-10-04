import { isETHAddress, isiAddress, isRAddress } from "./rules";
import { GLOBAL_ADDRESS, BLOCKCHAIN_NAME, FLAGS } from 'constants/contractAddress';

export const getTokenOptions = (poolAvailable, tokens) => (
  poolAvailable ? tokens : tokens.filter(option => !(parseInt(option.flags) & FLAGS.MAPPING_ISBRIDGE_CURRENCY))
)

export const getDestinations = (token, addr) => ([
  { value: BLOCKCHAIN_NAME, label: `${token ?? BLOCKCHAIN_NAME} on ${BLOCKCHAIN_NAME}`, iaddress: addr },
  { value: "bridgeBRIDGE", label: `Convert to Bridge.vETH on ${BLOCKCHAIN_NAME}`, iaddress: GLOBAL_ADDRESS.BETH },
  { value: "bridgeDAI", label: `Convert to DAI on ${BLOCKCHAIN_NAME}`, iaddress: GLOBAL_ADDRESS.DAI },
  { value: "bridgeVRSC", label: `Convert to ${BLOCKCHAIN_NAME} on ${BLOCKCHAIN_NAME}`, iaddress: GLOBAL_ADDRESS.VRSC },
  { value: "bridgeETH", label: `Convert to ETH on ${BLOCKCHAIN_NAME}`, iaddress: GLOBAL_ADDRESS.ETH },
  { value: "bridgeMKR", label: `Convert to MKR on ${BLOCKCHAIN_NAME}`, iaddress: GLOBAL_ADDRESS.MKR },
  { value: "swaptoBRIDGE", label: "Convert to Bridge.vETH Token and (Bounce back to ETH)", iaddress: GLOBAL_ADDRESS.BETH },
  { value: "swaptoVRSC", label: `Convert to ${BLOCKCHAIN_NAME} Token and (Bounce back to ETH)`, iaddress: GLOBAL_ADDRESS.VRSC },
  { value: "swaptoDAI", label: "Convert to DAI Token and (Bounce back to ETH)", iaddress: GLOBAL_ADDRESS.DAI },
  { value: "swaptoETH", label: "Convert to ETH and (Bounce back to ETH)", iaddress: GLOBAL_ADDRESS.ETH },
  { value: "swaptoMKR", label: "Convert to MKR Token and (Bounce back to ETH)", iaddress: GLOBAL_ADDRESS.MKR }
]);

const destionationOptionsByPool = [
  "swaptoBRIDGE", "swaptoVRSC", 'bridgeBRIDGE', 'swaptoDAI', 'swaptoETH', "swaptoMKR"
]

export const getDestinationOptions = (poolAvailable, address, selectedToken, tokenName) => {

  // Destination currency is vrsc all curencies pre pool launch.
  if (!address || !selectedToken) {
    return [];
  }
  const options = !poolAvailable
    ? [{ value: BLOCKCHAIN_NAME, label: `${tokenName ?? BLOCKCHAIN_NAME} on ${BLOCKCHAIN_NAME}`, iaddress: selectedToken }]
    : getDestinations(tokenName, selectedToken)

  const addedToken = ![GLOBAL_ADDRESS.DAI, GLOBAL_ADDRESS.VRSC, GLOBAL_ADDRESS.BETH, GLOBAL_ADDRESS.ETH, GLOBAL_ADDRESS.MKR].includes(selectedToken);

  if (isETHAddress(address)) {
    const ethOptions = options.filter(option => ![BLOCKCHAIN_NAME, 'bridgeBRIDGE', 'bridgeDAI', 'bridgeVRSC', 'bridgeETH', 'bridgeMKR', `bridge${BLOCKCHAIN_NAME}`].includes(option.value));
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
  else if (isiAddress(address) || isRAddress(address)) {
    const vscOptions = options.filter(option => [BLOCKCHAIN_NAME, 'bridgeBRIDGE', 'bridgeDAI', 'bridgeVRSC', 'bridgeETH', 'bridgeMKR'].includes(option.value));

    if (!poolAvailable || addedToken) {
      return vscOptions.filter(option => option.value === BLOCKCHAIN_NAME)
    }

    else {
      return vscOptions.filter(option => (option.iaddress !== selectedToken) || (option.value.slice(0, 6) !== 'bridge'));
    }
  }
  else {
    return options;
  }
}
