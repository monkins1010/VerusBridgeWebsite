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
    label: 'VRSCTEST',
    value: 'VRSCTEST'
  },
  {
    label: 'Bridge.veth',
    value: 'BRIDGE'
  }
];

const tokenOptionsByPool = [
  "BRIDGE"
]

export const getTokenOptions = (poolAvailable) => (
  poolAvailable === "0" ? TOKEN_OPTIONS.filter(option => !tokenOptionsByPool.includes(option.value)) : TOKEN_OPTIONS
)

export const DESTINATION_OPTIONS = [
  { value : "vrsctest", label: "To VRSCTEST wallet (no conversion)" },
  { value : "bridge", label: "Convert to Bridge.veth on VRSCTEST" },
  { value : "bridgeUSDC", label: "Convert to USDC on VRSCTEST" },
  { value : "bridgeVRSCTEST", label: "Convert to VRSCTEST on VRSCTEST" },
  { value : "bridgeETH", label: "Convert to ETH on VRSCTEST" },
  { value : "swaptoBRIDGE", label: "Convert to bridge Token (Bounce back to ETH)" },
  { value : "swaptoVRSCTEST", label: "Convert to VRSCTEST Token (Bounce back to ETH)" },
  { value : "swaptoUSDC", label: "Convert to USDC Token (Bounce back to ETH)" },
  { value : "swaptoETH", label: "Convert to ETH (Bounce back to ETH)" }
];

const destionationOptionsByPool = [
  "swaptoBRIDGE", "swaptoVRSCTEST", 'bridge', 'swaptoUSDC', 'swaptoETH'
]

export const getDestinationOptions = (poolAvailable) => (
  poolAvailable === "0" ? DESTINATION_OPTIONS.filter(option => !destionationOptionsByPool.includes(option.value)) : DESTINATION_OPTIONS
)
