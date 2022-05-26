import { NetworkConnector } from '@web3-react/network-connector';

import { NAME_ID_MAPPING } from '../constants/chain';

const RPC_URLS = {
  [NAME_ID_MAPPING.RINKEBY.id]: process.env.REACT_APP_RPC_URL_RINKEBY || '',
  [NAME_ID_MAPPING.GOERLI.id]: process.env.REACT_APP_RPC_URL_GOERLI || ''
  // [NAME_ID_MAPPING.HOMESTEAD.id]: process.env.REACT_APP_RPC_URL_HOMESTEAD || ''
};

export const networkConnector = new NetworkConnector({
  urls: RPC_URLS,
  defaultChainId: NAME_ID_MAPPING.GOERLI.id
});
