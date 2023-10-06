import { convertVerusAddressToEthAddress, fromBase58ToHex } from "./convert";
import { isiAddress, isRAddress, isETHAddress } from 'utils/rules';
import { GLOBAL_ADDRESS, BLOCKCHAIN_NAME } from "constants/contractAddress";
import { ETH_FEES } from 'constants/contractAddress';

// Flags for CTransferDesination type
export const DEST_PKH = 2
export const DEST_ID = 4
export const DEST_ETH = 9
const FLAG_DEST_AUX = 64
const FLAG_DEST_GATEWAY = 128

const VALID = 1
const CONVERT = 2
const PRECONVERT = 4
const CROSS_SYSTEM = 0x40                // if this is set there is a systemID serialized and deserialized as well for destination
const IMPORT_TO_SOURCE = 0x200           // set when the source currency not destination is the import currency
const RESERVE_TO_RESERVE = 0x400         // for arbitrage or transient conversion 2 stage solving (2nd from new fractional to reserves)
const bounceBackFee = Buffer.alloc(8); //write LE bounce back fee 

export const getConfigOptions = ({ address, destination, poolAvailable, token, GASPrice, auxDest }) => {
  let destinationtype = null;
  let flagvalue = VALID;
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
  } else if (isETHAddress(address)) {
    destinationtype = DEST_ETH + FLAG_DEST_AUX; //ETH TYPE
    destinationaddress = `${address}01160214${convertVerusAddressToEthAddress(auxDest).slice(2)}`; // vec 01 , subvec length 0x16, type DEST_PKH length 0x14
  }

  if (destinationtype === DEST_ID || destinationtype === DEST_PKH) { //if I or R address chosen then do one way specific stuff          
    if (!poolAvailable) { // pool not available
      if (destination === BLOCKCHAIN_NAME) {
        flagvalue = VALID;
        destinationcurrency = GLOBAL_ADDRESS.VRSC;
      } else {
        alert("Cannot convert yet Bridge.veth not launched"); //add in FLAGS logic for destination    
        return null;
      }
    } else {
      if (destination === BLOCKCHAIN_NAME) {
        destinationcurrency = GLOBAL_ADDRESS.BETH; //bridge open all sends go to bridge.veth         
        flagvalue = VALID;
      } else if (destination === 'bridgeDAI') {
        if (token.value !== GLOBAL_ADDRESS.DAI && token.value !== GLOBAL_ADDRESS.BETH) {
          destinationcurrency = GLOBAL_ADDRESS.BETH;  //bridge open convert from token  to DAI 
          secondreserveid = GLOBAL_ADDRESS.DAI;
          flagvalue = VALID + CONVERT + RESERVE_TO_RESERVE;   //add convert flag on
        } else if (token.value === GLOBAL_ADDRESS.BETH) {
          destinationcurrency = GLOBAL_ADDRESS.DAI;
          flagvalue = VALID + CONVERT + IMPORT_TO_SOURCE;
        } else {
          alert(`Cannot convert DAI to DAI. Send Direct to ${BLOCKCHAIN_NAME}`); //add in FLAGS logic for destination
          return null;
        }
      } else if (destination === 'bridgeVRSC') {
        if (token.value !== GLOBAL_ADDRESS.VRSC && token.value !== GLOBAL_ADDRESS.BETH) {
          destinationcurrency = GLOBAL_ADDRESS.BETH;  //bridge open convert from token to VRSC
          secondreserveid = GLOBAL_ADDRESS.VRSC;
          flagvalue = VALID + CONVERT + RESERVE_TO_RESERVE;   //add convert flag on
        } else if (token.value === GLOBAL_ADDRESS.BETH) {
          destinationcurrency = GLOBAL_ADDRESS.VRSC;
          flagvalue = VALID + CONVERT + IMPORT_TO_SOURCE;
        } else {
          alert(`Cannot convert ${BLOCKCHAIN_NAME} to ${BLOCKCHAIN_NAME}. Send Direct to ${BLOCKCHAIN_NAME}`); //add in FLAGS logic for destination
          return null;
        }
      } else if (destination === 'bridgeETH') {
        if (token.value !== GLOBAL_ADDRESS.ETH && token.value !== GLOBAL_ADDRESS.BETH) {
          destinationcurrency = GLOBAL_ADDRESS.BETH;  //bridge open convert from token to ETH
          secondreserveid = GLOBAL_ADDRESS.ETH;
          flagvalue = VALID + CONVERT + RESERVE_TO_RESERVE;   //add convert flag on
        } else if (token.value === GLOBAL_ADDRESS.BETH) {
          destinationcurrency = GLOBAL_ADDRESS.ETH;
          flagvalue = VALID + CONVERT + IMPORT_TO_SOURCE;
        } else {
          alert(`Cannot convert ETH to ETH. Send Direct to ${BLOCKCHAIN_NAME}`); //add in FLAGS logic for destination
          return null;
        }
      } else if (destination === 'bridgeMKR') {
        if (token.value !== GLOBAL_ADDRESS.MKR && token.value !== GLOBAL_ADDRESS.BETH) {
          destinationcurrency = GLOBAL_ADDRESS.BETH;  //bridge open convert from token to ETH
          secondreserveid = GLOBAL_ADDRESS.MKR;
          flagvalue = VALID + CONVERT + RESERVE_TO_RESERVE;   //add convert flag on
        } else if (token.value === GLOBAL_ADDRESS.BETH) {
          destinationcurrency = GLOBAL_ADDRESS.MKR;
          flagvalue = VALID + CONVERT + IMPORT_TO_SOURCE;
        } else {
          alert(`Cannot convert MKR to MKR. Send Direct to ${BLOCKCHAIN_NAME}`); //add in FLAGS logic for destination
          return null;
        }
      } else if (destination === `bridge${BLOCKCHAIN_NAME.toUpperCase()}`) {
        if (token.value !== GLOBAL_ADDRESS.VRSC && token.value !== GLOBAL_ADDRESS.BETH) {
          destinationcurrency = GLOBAL_ADDRESS.BETH;  //bridge open convert from token to ETH
          secondreserveid = GLOBAL_ADDRESS.VRSC;
          flagvalue = VALID + CONVERT + RESERVE_TO_RESERVE;   //add convert flag on
        } else if (token.value === GLOBAL_ADDRESS.BETH) {
          destinationcurrency = GLOBAL_ADDRESS.VRSC;
          flagvalue = VALID + CONVERT + IMPORT_TO_SOURCE;
        } else {
          alert(`Cannot convert ${BLOCKCHAIN_NAME} to ${BLOCKCHAIN_NAME}. Send Direct to ${BLOCKCHAIN_NAME}`); //add in FLAGS logic for destination
          return null;
        }
      }
      else if (destination === 'bridgeBRIDGE') {

        destinationcurrency = GLOBAL_ADDRESS.BETH;  //bridge open all sends go to bridge.veth
        if (token.value !== GLOBAL_ADDRESS.BETH) {
          flagvalue = VALID + CONVERT;   //add convert flag on
        } else {
          alert(`Cannot convert bridge to bridge. Send Direct to ${BLOCKCHAIN_NAME}`); //add in FLAGS logic for destination
          return null;
        }
      } else {
        alert("Cannot bounce back, direct send only with i or R address"); //add in FLAGS logic for destination
        return null;
      }
    }
  } else if (
    destinationtype === DEST_ETH + FLAG_DEST_AUX
    && poolAvailable
    && token.value !== GLOBAL_ADDRESS.BETH
    && GASPrice
  ) {  // if ethereuem address and pool is available 
    destinationcurrency = GLOBAL_ADDRESS.BETH;
    destinationtype += FLAG_DEST_GATEWAY; //add 128 = FLAG_DEST_GATEWAY

    bounceBackFee.writeUInt32LE(GASPrice.SATSCOST);
    //destination is concatenated with the gateway back address (bridge.veth) + uint160() + 0.003 ETH in fees uint64LE
    destinationaddress = destinationaddress.slice(0, 42) + GLOBAL_ADDRESS.ETH.slice(2) + "0000000000000000000000000000000000000000" + bounceBackFee.toString('hex') + destinationaddress.slice(42);

    if (destination === "swaptoVRSC") {
      secondreserveid = GLOBAL_ADDRESS.VRSC;
      flagvalue = VALID + CONVERT + RESERVE_TO_RESERVE;
    }
    if (destination === "swaptoDAI") {
      secondreserveid = GLOBAL_ADDRESS.DAI;
      flagvalue = VALID + CONVERT + RESERVE_TO_RESERVE;
    }
    if (destination === "swaptoBRIDGE") {
      flagvalue = VALID + CONVERT;
    }
    if (destination === "swaptoETH") {
      secondreserveid = GLOBAL_ADDRESS.ETH;
      flagvalue = VALID + CONVERT + RESERVE_TO_RESERVE;
    }
    if (destination === "swaptoMKR") {
      secondreserveid = GLOBAL_ADDRESS.MKR;
      flagvalue = VALID + CONVERT + RESERVE_TO_RESERVE;
    }


  } else if (
    destinationtype === DEST_ETH + FLAG_DEST_AUX
    && poolAvailable
    && token.value === GLOBAL_ADDRESS.BETH
    && GASPrice
  ) {  // if ethereuem address and pool is available 
    destinationtype += FLAG_DEST_GATEWAY;

    bounceBackFee.writeUInt32LE(GASPrice.SATSCOST);
    //destination is concatenated with the gateway back address (vETH) + uint160() + 0.003 ETH in fees uint64LE
    destinationaddress = destinationaddress.slice(0, 42) + GLOBAL_ADDRESS.ETH.slice(2) + "0000000000000000000000000000000000000000" + bounceBackFee.toString('hex') + destinationaddress.slice(42);

    if (destination === "swaptoVRSC") {
      destinationcurrency = GLOBAL_ADDRESS.VRSC;
      flagvalue = VALID + CONVERT + IMPORT_TO_SOURCE;
    }
    if (destination === "swaptoDAI") {
      destinationcurrency = GLOBAL_ADDRESS.DAI;
      flagvalue = VALID + CONVERT + IMPORT_TO_SOURCE;
    }
    if (destination === "swaptoETH") {
      destinationcurrency = GLOBAL_ADDRESS.ETH;
      flagvalue = VALID + CONVERT + IMPORT_TO_SOURCE;
    }
    if (destination === "swaptoMKR") {
      destinationcurrency = GLOBAL_ADDRESS.MKR;
      flagvalue = VALID + CONVERT + IMPORT_TO_SOURCE;
    }

  } else {
    alert("Bridge.veth not launched yet, send only direct to i or R until launch complete"); //add in FLAGS logic for destination
    return null;
  }

  let feecurrency = {};
  let fees = {};
  if (poolAvailable) {
    feecurrency = GLOBAL_ADDRESS.ETH;
    fees = ETH_FEES.SATS; //0.003 ETH FEE
  } else {
    feecurrency = GLOBAL_ADDRESS.VRSC; //pre bridge launch fees must be set as vrsc
    fees = 2000000  // 0.02 VRSC
  }

  return { flagvalue, feecurrency, fees, destinationtype, destinationaddress, destinationcurrency, secondreserveid }
}