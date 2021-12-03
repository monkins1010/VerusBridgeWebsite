import React from 'react';

import ToastProvider from 'components/Toast/ToastProvider';

import Checkout from './pages/Checkout';
import Web3ConnectionProvider from './providers/Web3ConnectionProvider';
import WrappedWeb3ReactProvider from './providers/WrappedWeb3ReactProvider';

function App() {
  return (
    <WrappedWeb3ReactProvider>
      <Web3ConnectionProvider>
          <ToastProvider>
            <Checkout />
          </ToastProvider>
      </Web3ConnectionProvider>
    </WrappedWeb3ReactProvider>
  );
}

export default App;
