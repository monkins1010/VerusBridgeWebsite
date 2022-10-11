import React from 'react';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import ToastProvider from 'components/Toast/ToastProvider';

import Tabs from "./components/TabComponent/Tabs";
import Web3ConnectionProvider from './providers/Web3ConnectionProvider';
import WrappedWeb3ReactProvider from './providers/WrappedWeb3ReactProvider';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3165d4'
    }
  }
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <WrappedWeb3ReactProvider>
        <Web3ConnectionProvider>
          <ToastProvider>
            <Tabs />
          </ToastProvider>
        </Web3ConnectionProvider>
      </WrappedWeb3ReactProvider>
    </ThemeProvider>
  );
}

export default App;
