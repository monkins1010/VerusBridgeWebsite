import React, { useState, useEffect } from 'react';

import { useWeb3React } from '@web3-react/core';

import DELEGATOR_ABI from 'abis/DelegatorAbi.json';
import AutocompleteControlField from 'components/AutocompleteControlField'
import { DELEGATOR_ADD, FLAGS } from 'constants/contractAddress';
import useContract from 'hooks/useContract';

const NFTField = ({ control }) => {
  const [verusNFTS, setVerusNFTS] = useState(['']);
  const delegatorContract = useContract(DELEGATOR_ADD, DELEGATOR_ABI);
  const { account } = useWeb3React();

  const getNFTs = async () => {

    const tokens = await delegatorContract.callStatic.getTokenList(0, 0);
    const TOKEN_OPTIONS = tokens.map(e => ({
      // eslint-disable-next-line
      label: e.flags & FLAGS.MAPPING_ERC721_NFT_DEFINITION
        ? `${e.name} [ERC721]`
        // eslint-disable-next-line
        : e.flags & FLAGS.MAPPING_ERC1155_NFT_DEFINITION ?
          `${e.name} [ERC1155 Verus single NFT]` :
          `${e.name} [ERC1155 Tokens]`,
      value: e.tokenID, iaddress: e.iaddress, erc20address: e.erc20ContractAddress, flags: e.flags
    }))
      // eslint-disable-next-line
      .filter(nft => nft.flags & (FLAGS.MAPPING_ERC1155_NFT_DEFINITION + FLAGS.MAPPING_ERC1155_ERC_DEFINITION + FLAGS.MAPPING_ERC721_NFT_DEFINITION))
    TOKEN_OPTIONS[0].label = `Verus created ERC721's are in contract (${TOKEN_OPTIONS[0].erc20address})`

    return TOKEN_OPTIONS
  }

  useEffect(async () => {

    if (delegatorContract && account) {
      const nfts = await getNFTs();

      setVerusNFTS(nfts);
    }
  }, [delegatorContract, account])

  return (<AutocompleteControlField
    name="nft"
    id="nft"
    label="NFT"
    fullWidth
    variant="standard"
    defaultValue=""
    control={control}
    options={verusNFTS}
    rules={{
      required: 'Address is required'
    }}
  />)

}
export default NFTField
