import { isETHAddress, isiAddress, isRAddress } from "./rules";
import { FLAGS } from 'constants/contractAddress';
import { GLOBAL_ADDRESS } from 'constants/contractAddress';

export const getTokenOptions = (poolAvailable, tokens) => (
  !poolAvailable ? tokens.filter(option => parseInt(option.flags) < 10 ) : tokens
)

export const getDestinations = (token, addr) => ([
  { value : "vrsctest", label: `${token ?? 'VRSCTEST'} on VRSCTEST`, iaddress: addr  },
  { value : "bridgeBRIDGE", label: "Convert to Bridge.vETH on VRSCTEST" , iaddress: "0xffEce948b8A38bBcC813411D2597f7f8485a0689"},
  { value : "bridgeUSDC", label: "Convert to USDC on VRSCTEST", iaddress: "0xF0A1263056c30E221F0F851C36b767ffF2544f7F" },
  { value : "bridgeVRSCTEST", label: "Convert to VRSCTEST on VRSCTEST", iaddress: "0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d" },
  { value : "bridgeETH", label: "Convert to ETH on VRSCTEST", iaddress: "0x67460C2f56774eD27EeB8685f29f6CEC0B090B00" },
  { value : "swaptoBRIDGE", label: "Convert to Bridge.vETH Token (Bounce back to ETH)", iaddress: "0xffEce948b8A38bBcC813411D2597f7f8485a0689" },
  { value : "swaptoVRSC", label: "Convert to VRSCTEST Token (Bounce back to ETH)", iaddress: "0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d" },
  { value : "swaptoUSDC", label: "Convert to USDC Token (Bounce back to ETH)", iaddress: "0xF0A1263056c30E221F0F851C36b767ffF2544f7F" },
  { value : "swaptoETH", label: "Convert to ETH (Bounce back to ETH)", iaddress: "0x67460C2f56774eD27EeB8685f29f6CEC0B090B00" }
]);

const destionationOptionsByPool = [
  "swaptoBRIDGE", "swaptoVRSC", 'bridgeBRIDGE', 'swaptoUSDC', 'swaptoETH'
]

export const getDestinationOptions = (poolAvailable, address, selectedToken, tokenName) => {
  
  const options = !poolAvailable
    ? getDestinations(tokenName, selectedToken).filter(option => !destionationOptionsByPool.includes(option.value)) 
    : getDestinations(tokenName, selectedToken)
  
  const addedToken = ![GLOBAL_ADDRESS.USDC, GLOBAL_ADDRESS.VRSC, GLOBAL_ADDRESS.BETH, GLOBAL_ADDRESS.ETH].includes(selectedToken);

  if (isETHAddress(address)) {
    const ethOptions = options.filter(option => !['vrsctest', 'bridgeBRIDGE', 'bridgeUSDC', 'bridgeVRSC', 'bridgeETH', 'bridgeVRSCTEST'].includes(option.value)); 
    if(addedToken) 
    {
      return [] //if its a mapped added token dont offer bounce back
    } 
    if(selectedToken) {
      return ethOptions.filter(option => option.iaddress !== selectedToken);
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
    } //else {
     // return vscOptions.filter(option => option.iaddress !== selectedToken);
   // }
  }

  return options;
}
