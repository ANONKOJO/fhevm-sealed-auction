import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ethers } from 'ethers';
import { initializeFheInstance } from './lib/fhevm';

import Home from './pages/Home';
import Browse from './pages/Browse';
import Create from './pages/Create';
import AuctionDetail from './pages/AuctionDetail';
import Navbar from './components/Navbar';

import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [fhevmInstance, setFhevmInstance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fhevmStatus, setFhevmStatus] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'error'

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
      setFhevmInstance(null);
      setFhevmStatus('idle');
    } else {
      connectWallet();
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setFhevmInstance(null);
    setFhevmStatus('idle');
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

      // Initialize FHEVM using the working CDN-based SDK
      console.log('🔐 Initializing FHEVM from CDN...');
      setFhevmStatus('loading');
      
      try {
        const instance = await initializeFheInstance();
        setFhevmInstance(instance);
        setFhevmStatus('ready');
        console.log('✅ FHEVM initialized successfully!');
      } catch (fheError) {
        console.error('FHEVM initialization failed:', fheError);
        setFhevmStatus('error');
        alert('FHEVM initialization failed. Please refresh the page and try again.');
      }
      
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
            element={<Browse account={account} signer={signer} fhevmInstance={fhevmInstance} fhevmStatus={fhevmStatus} />} 
          />
          <Route 
            path="/create" 
            element={<Create account={account} signer={signer} fhevmInstance={fhevmInstance} fhevmStatus={fhevmStatus} />} 
          />
          <Route 
            path="/auction/:id" 
            element={<AuctionDetail account={account} signer={signer} fhevmInstance={fhevmInstance} fhevmStatus={fhevmStatus} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;