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
    value: 'bridge'
  }
];

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
]
