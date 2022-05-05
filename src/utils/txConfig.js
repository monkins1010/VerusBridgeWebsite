import { convertVerusAddressToEthAddress } from "./convert";
import { isiAddress, isRAddress, isETHAddress } from 'utils/rules';
import { GLOBAL_ADDRESS } from "constants/contractAddress";
import { ETH_FEES } from 'constants/contractAddress';

// Flags for CTransferDesination type
export const  DEST_PKH = 2
export const  DEST_ID = 4
export const  DEST_ETH = 9
const  FLAG_DEST_GATEWAY = 128

const  VALID = 1
const  CONVERT = 2
const  PRECONVERT = 4
const  CROSS_SYSTEM = 0x40                // if this is set there is a systemID serialized and deserialized as well for destination
const  IMPORT_TO_SOURCE = 0x200           // set when the source currency not destination is the import currency
const  RESERVE_TO_RESERVE = 0x400         // for arbitrage or transient conversion 2 stage solving (2nd from new fractional to reserves)
const  bounceBackFee = Buffer.alloc(8); //write LE bounce back fee 

export const getConfigOptions = ({address, destination, poolAvailable, token}) => {
  let destinationtype = null;
  let flagvalue = VALID ;
  let secondreserveid = "0x0000000000000000000000000000000000000000"
  let destinationcurrency = null;

  let destinationaddress = {};
  //set destination to correct type
  if (isiAddress(address)) {
    destinationtype = DEST_ID; //ID TYPE 
    destinationaddress = convertVerusAddressToEthAddress(address)
  } else if (isRAddress(address)) {
    destinationtype = DEST_PKH; //R TYPE
    destinationaddress = convertVerusAddressToEthAddress(address)
  }else if (isETHAddress(address)) {
    destinationtype = DEST_ETH; //ETH TYPE
    destinationaddress = address;
  }
 
  if(destinationtype === DEST_ID || destinationtype === DEST_PKH ) { //if I or R address chosen then do one way specific stuff          
      if(!poolAvailable) { // pool not available
        if(destination === 'vrsctest'){
          flagvalue = VALID ;
          destinationcurrency = 'VRSC';
        } else {
          alert("Cannot convert yet Bridge.veth not launched"); //add in FLAGS logic for destination    
          return null;
        }
      } else {
        if (destination === 'vrsctest') {              
          destinationcurrency = 'BETH';  //bridge open all sends go to bridge.veth
          flagvalue = VALID ; 
        } else if(destination === 'bridgeUSDC') {
          if(token !== 'USDC' && token !== 'BETH') {
            destinationcurrency = 'BETH';  //bridge open convert from token  to USDC 
            secondreserveid = GLOBAL_ADDRESS.USDC;
            flagvalue = VALID + CONVERT  + RESERVE_TO_RESERVE ;   //add convert flag on
          } else if(token === 'BETH') {
            destinationcurrency = "USDC";
            flagvalue = VALID + CONVERT  +  IMPORT_TO_SOURCE;
          } else {
            alert("Cannot convert USDC to USDC. Send Direct to VRSCTEST"); //add in FLAGS logic for destination
            return null;
          }
        } else if (destination === 'bridgeVRSC') {
          if(token !== 'VRSC' && token !== 'BETH'){
            destinationcurrency = 'BETH';  //bridge open convert from token to VRSCTEST
            secondreserveid = GLOBAL_ADDRESS.VRSC;
            flagvalue = VALID + CONVERT  + RESERVE_TO_RESERVE ;   //add convert flag on
          } else if( token === 'BETH') {
            destinationcurrency = 'VRSC';
            flagvalue = VALID + CONVERT  +  IMPORT_TO_SOURCE;
          } else {
            alert("Cannot convert VRSCTEST to VRSCTEST. Send Direct to VRSCTEST"); //add in FLAGS logic for destination
            return null;
          }
        } else if(destination === 'bridgeETH') {
          if(token !== 'ETH' && token !== 'BETH') {
            destinationcurrency = 'BETH';  //bridge open convert from token to ETH
            secondreserveid = GLOBAL_ADDRESS.ETH;
            flagvalue = VALID + CONVERT  + RESERVE_TO_RESERVE ;   //add convert flag on
          } else if( token === 'BETH') {
            destinationcurrency = "ETH";
            flagvalue = VALID + CONVERT  +  IMPORT_TO_SOURCE;
          } else {
            alert("Cannot convert ETH to ETH. Send Direct to VRSCTEST"); //add in FLAGS logic for destination
            return null;
          }
        } else if(destination === 'bridgeBRIDGE') {  
          
          destinationcurrency = 'BETH';  //bridge open all sends go to bridge.veth
          if(token !== 'BETH') {
            flagvalue = VALID + CONVERT  ;   //add convert flag on
          } else {
            alert("Cannot convert bridge to bridge. Send Direct to VRSCTEST"); //add in FLAGS logic for destination
            return null;
          }
        } else {
          alert("Cannot bounce back, direct send only with i or R address"); //add in FLAGS logic for destination
          return null;
        }
      }
  } else if (
    destinationtype === DEST_ETH 
    && poolAvailable  
    && token !== 'BETH'  
  ) {  // if ethereuem address and pool is available 
      destinationcurrency = 'BETH';
      destinationtype += FLAG_DEST_GATEWAY; //add 128 = FLAG_DEST_GATEWAY
      bounceBackFee.writeUInt32LE(ETH_FEES.SATS);
      //destination is concatenated with the gateway back address (bridge.veth) + uint160() + 0.003 ETH in fees uint64LE
      destinationaddress += "67460C2f56774eD27EeB8685f29f6CEC0B090B00" + "0000000000000000000000000000000000000000" + bounceBackFee.toString('hex');

      if(destination === "swaptoVRSC"){
        secondreserveid = GLOBAL_ADDRESS.VRSC;
        flagvalue = VALID + CONVERT  + RESERVE_TO_RESERVE;
      }
      if(destination === "swaptoUSDC"){
        secondreserveid = GLOBAL_ADDRESS.USDC;
        flagvalue = VALID + CONVERT  +  RESERVE_TO_RESERVE;
      }
      if(destination === "swaptoBRIDGE"){
        flagvalue = VALID + CONVERT  ;
      }
      if(destination === "swaptoETH"){
        secondreserveid = GLOBAL_ADDRESS.ETH;
        flagvalue = VALID + CONVERT  +  RESERVE_TO_RESERVE ;
      }
  } else if (
    destinationtype === DEST_ETH 
    && poolAvailable  
    && token === 'BETH' 
  ) {  // if ethereuem address and pool is available 
      destinationtype += FLAG_DEST_GATEWAY; 
      bounceBackFee.writeUInt32LE(ETH_FEES.SATS);
      //destination is concatenated with the gateway back address (bridge.veth) + uint160() + 0.003 ETH in fees uint64LE
      destinationaddress += "67460C2f56774eD27EeB8685f29f6CEC0B090B00" + "0000000000000000000000000000000000000000" + bounceBackFee.toString('hex');

      if(destination === "swaptoVRSC"){
        destinationcurrency = 'VRSC';
        flagvalue = VALID + CONVERT  + IMPORT_TO_SOURCE;
      }
      if(destination === "swaptoUSDC"){
        destinationcurrency = "USDC";
        flagvalue = VALID + CONVERT  +  IMPORT_TO_SOURCE;
      }
      if(destination === "swaptoETH"){
        destinationcurrency = "ETH";
        flagvalue = VALID + CONVERT  +  IMPORT_TO_SOURCE;
      }
  } else {
    alert("Bridge.veth not launched yet, send only direct to i or R until launch complete"); //add in FLAGS logic for destination
    return null;
  }

  let feecurrency = {};
  let fees = {};
  if(poolAvailable ){
    feecurrency = GLOBAL_ADDRESS.ETH;
    fees = ETH_FEES.SATS; //0.003 ETH FEE
  }else{
    feecurrency = GLOBAL_ADDRESS.VRSC; //pre bridge launch fees must be set as vrsctest
    fees = 2000000  // 0.02 VRSCTEST
  }

  return {flagvalue, feecurrency, fees, destinationtype, destinationaddress, destinationcurrency, secondreserveid}
}