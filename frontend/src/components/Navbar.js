import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ account, onConnect, onDisconnect, loading }) => {
  const location = useLocation();

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">🔐</div>
          <span className="logo-text">FHEVM Auction</span>
        </Link>

        <div className="navbar-links">
          <Link 
            to="/browse" 
            className={`nav-link ${isActive('/browse') ? 'active' : ''}`}
          >
            Browse
          </Link>
          <Link 
            to="/create" 
            className={`nav-link ${isActive('/create') ? 'active' : ''}`}
          >
            Create
          </Link>
        </div>

        <div className="navbar-actions">
         {account ? (
  <div className="wallet-actions">
    <div className="wallet-connected">
      <Wallet size={18} />
      <span>{formatAddress(account)}</span>
    </div>
    <button onClick={onDisconnect} className="btn-disconnect">
      Disconnect
    </button>
  </div>
          ) : (
            <button 
              onClick={onConnect} 
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;