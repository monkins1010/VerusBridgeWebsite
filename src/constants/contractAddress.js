export const DELEGATOR_ADD = process.env.REACT_APP_DELEGATOR_CONTRACT
export const TESTNET = () => {
  const retVal = process.env.REACT_APP_TESTNET_ACTIVE !== undefined ||
    process.env.REACT_APP_TESTNET_ACTIVE === true;
  return retVal
}
export const ETHEREUM_BLOCKCHAIN_NAME = TESTNET ? "Goerli" : "Ethereum";

export const BLOCKCHAIN_NAME = (TESTNET ? "vrsctest" : "vrsc").toUpperCase();

export const DAI_ERC20ADD = TESTNET ? "0xB897f2448054bc5b133268A53090e110D101FFf0" :
  "0x6B175474E89094C44Da98b954EedeAC495271d0F";  // DAI token is pre-existing chain

export const GLOBAL_ADDRESS = TESTNET ? { // vrsctest hex 'id' names of currencies must be checksummed i.e. mixture of capitals
  VRSC: "0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d",
  ETH: "0x67460C2f56774eD27EeB8685f29f6CEC0B090B00",
  DAI: "0xCCe5d18f305474F1e0e0ec1C507D8c85e7315fdf",
  BETH: "0xffEce948b8A38bBcC813411D2597f7f8485a0689",
  MKR: "0x005005b2b10a897FeD36FbD71c878213a7a169BF"
} : {
  VRSC: "0x1Af5b8015C64d39Ab44C60EAd8317f9F5a9B6C4C",
  ETH: "0x454CB83913D688795E237837d30258d11ea7c752",
  DAI: "0x8b72F1c2D326d376aDd46698E385Cf624f0CA1dA",
  BETH: "0x0200EbbD26467B866120D84A0d37c82CdE0acAEB",
  MKR: "0x65b5AaC6A4aa0Eb656AB6B8812184e7545b6A221"
}

export const GLOBAL_IADDRESS = TESTNET ? { // vrsctest hex 'id' names of currencies must be checksummed i.e. mixture of capitals
  VRSC: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
  ETH: "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm",
  DAI: "iN9vbHXexEh6GTZ45fRoJGKTQThfbgUwMh",
  BETH: "iSojYsotVzXz4wh2eJriASGo6UidJDDhL2",
  MKR: "i3WBJ7xEjTna5345D7gPnK4nKfbEBujZqL"
} : {
  VRSC: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
  ETH: "i9nwxtKuVYX4MSbeULLiK2ttVi6rUEhh4X",
  DAI: "iGBs4DWztRNvNEJBt4mqHszLxfKTNHTkhM",
  BETH: "i3f7tSctFkiPpiedY8QR5Tep9p4qDVebDx",
  MKR: "iCkKJuJScy4Z6NSDK7Mt42ZAB2NEnAE1o4"
}

export const ETH_FEES = {
  SATS: 300000, // 0.003 ETH FEE SATS (8 decimal places)
  ETH: "0.003", // 0.003 ETH FEE
  GAS_TRANSACTIONIMPORTFEE: "1000000", // Transactionimportfee as defined in vETH: as (TX GAS AMOUNT)
  MINIMUM_GAS_PRICE_WEI: "10000000000", // Minimum WEI price as defined in contract. (10 GWEI)
  VRSC_SATS_FEE: 2000000
}

export const FLAGS = {

  MAPPING_ETHEREUM_OWNED: 1,
  MAPPING_VERUS_OWNED: 2,
  MAPPING_PARTOF_BRIDGEVETH: 4,
  MAPPING_ISBRIDGE_CURRENCY: 8,
  MAPPING_ERC1155_NFT_DEFINITION: 16,
  MAPPING_ERC20_DEFINITION: 32,
  MAPPING_ERC1155_ERC_DEFINITION: 64,
  MAPPING_ERC721_NFT_DEFINITION: 128
}

export const HEIGHT_LOCATION_IN_FORKS = 130
