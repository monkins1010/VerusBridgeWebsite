import { isETHAddress, isiAddress, isRAddress } from "./rules";

export const TOKEN_OPTIONS = [
  {
    label: 'ETH',
    value: 'ETH'
   },
  {
    label: 'USDC',
    value: 'USDC'
  },
  {
    label: 'VRSC',
    value: 'VRSC'
  },
  {
    label: 'Bridge.vETH',
    value: 'BETH'
  }
];

const tokenOptionsByPool = [
  'BETH'
];

const TOKEN_MAPPING = {
  'ETH': 'vETH',
  'USDC': 'USDC.vETH',
  'VRSC': 'VRSC',
  'BETH': 'Bridge.vETH',
};

export const getTokenOptions = (poolAvailable, tokens) => (
  !poolAvailable ? tokens.filter(option => !tokenOptionsByPool.includes(option.value)) : tokens
)

export const getDestinations = (token) => ([
  { value : "vrsctest", label: `${token ?? 'VRSCTEST'} on VRSCTEST` },
  { value : "bridgeBRIDGE", label: "Convert to Bridge.vETH on VRSCTEST" },
  { value : "bridgeUSDC", label: "Convert to USDC on VRSCTEST" },
  { value : "bridgeVRSCTEST", label: "Convert to VRSCTEST on VRSCTEST" },
  { value : "bridgeETH", label: "Convert to ETH on VRSCTEST" },
  { value : "swaptoBRIDGE", label: "Convert to Bridge.vETH Token (Bounce back to ETH)" },
  { value : "swaptoVRSC", label: "Convert to VRSCTEST Token (Bounce back to ETH)" },
  { value : "swaptoUSDC", label: "Convert to USDC Token (Bounce back to ETH)" },
  { value : "swaptoETH", label: "Convert to ETH (Bounce back to ETH)" }
]);

const destionationOptionsByPool = [
  "swaptoBRIDGE", "swaptoVRSC", 'bridgeBRIDGE', 'swaptoUSDC', 'swaptoETH'
]


export const getDestinationOptions = (poolAvailable, address, selectedToken) => {
  
  const options = !poolAvailable
    ? getDestinations(selectedToken).filter(option => !destionationOptionsByPool.includes(option.value)) 
    : getDestinations(selectedToken)
  
  const addedToken = !['USDC', 'VRSC', 'BETH', 'ETH'].includes(selectedToken);

  if (isETHAddress(address)) {
    const ethOptions = options.filter(option => !['vrsctest', 'bridgeBRIDGE', 'bridgeUSDC', 'bridgeVRSC', 'bridgeETH'].includes(option.value)); 
    if(addedToken) 
    {
      return []
    } 
    if(selectedToken) {
      return ethOptions.filter(option => option.value !== `swapto${selectedToken}`);
    } 
    else
    {
      return ethOptions
    }
  }

  if(isiAddress(address) || isRAddress(address)) {
    const vscOptions = options.filter(option => ['vrsctest', 'bridgeBRIDGE', 'bridgeUSDC', 'bridgeVRSC', 'bridgeETH'].includes(option.value)); 
    if(!poolAvailable || addedToken) {
      return vscOptions.filter(option => option.value === 'vrsctest')
    } else {
      return vscOptions.filter(option => option.value !== `bridge${selectedToken}`);
    }
  }

  return options;
}
