import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ethers } from 'ethers';

import Home from './pages/Home';
import Browse from './pages/Browse';
import Create from './pages/Create';
import AuctionDetail from './pages/AuctionDetail';
import Navbar from './components/Navbar';

import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setSigner(null);
    } else {
      connectWallet();
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    alert('Wallet disconnected from app');
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!');
      return;
    }

    try {
      setLoading(true);
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (parseInt(chainId, 16) !== 11155111) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch (error) {
          alert('Please switch to Sepolia testnet');
          setLoading(false);
          return;
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const ethersSigner = await provider.getSigner();

      setSigner(ethersSigner);
      setAccount(accounts[0]);
      
      console.log('✅ Wallet connected successfully!');
      console.log('⚠️  FHE SDK integration pending - contract is FHE-ready');
      
      setLoading(false);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Error: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <Router>
      <div className="App">
        <Navbar 
          account={account} 
          onConnect={connectWallet}
          onDisconnect={disconnectWallet}
          loading={loading} 
        />
        
        <Routes>
          <Route path="/" element={<Home account={account} />} />
          <Route 
            path="/browse" 
            element={<Browse account={account} signer={signer} />} 
          />
          <Route 
            path="/create" 
            element={<Create account={account} signer={signer} />} 
          />
          <Route 
            path="/auction/:id" 
            element={<AuctionDetail account={account} signer={signer} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;