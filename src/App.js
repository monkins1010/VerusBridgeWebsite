import Checkout from './pages/Checkout';
import WrappedWeb3ReactProvider from './providers/WrappedWeb3ReactProvider';
import Web3ConnectionProvider from './providers/Web3ConnectionProvider';

function App() {
  return (
    <WrappedWeb3ReactProvider>
      <Web3ConnectionProvider>
        <Checkout />
      </Web3ConnectionProvider>
    </WrappedWeb3ReactProvider>
  );
}

export default App;
