// private testnetwork address
export const DELEGATOR_ADD = "0x0CD17C847B0D2d2c5f9e99f6B9ADB0bd920f852a";

export const DAI_ERC20ADD = "0xB897f2448054bc5b133268A53090e110D101FFf0";  // DAI token is pre-existing goerli
export const ETH_ERC20ADD = "0x5ef378642a309485fd0f27850ec7f0550104f530"

export const GLOBAL_ADDRESS = { // vrsctest hex 'id' names of currencies
  VRSC: "0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d",
  ETH: "0x67460C2f56774eD27EeB8685f29f6CEC0B090B00",
  DAI: "0xcce5d18f305474f1e0e0ec1c507d8c85e7315fdf",
  BETH: "0xffEce948b8A38bBcC813411D2597f7f8485a0689"
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
  MAPPING_ISBRIDGE_CURRENCY: 8
}

