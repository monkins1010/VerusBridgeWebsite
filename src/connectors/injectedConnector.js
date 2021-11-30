import { InjectedConnector } from '@web3-react/injected-connector';

import { ID_NAME_MAPPING } from '../constants/chain';

const IDs = Object.keys(ID_NAME_MAPPING).map(value => +value);

export const injectedConnector = new InjectedConnector({
  supportedChainIds: IDs
});
