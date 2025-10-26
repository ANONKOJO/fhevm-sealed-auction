import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Zap } from 'lucide-react';
import './Home.css';

const Home = ({ account }) => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">Powered by Zama FHEVM</div>
            <h1 className="hero-title">
              Truly Private
              <span className="hero-title-accent"> Sealed-Bid</span>
              <br />Auctions with FHE
            </h1>
            <p className="hero-description">
              All bids encrypted using Fully Homomorphic Encryption. 
              Nobody can see your bid until the auction ends—provably private.
            </p>
            <div className="hero-cta">
              <Link to="/browse" className="btn btn-primary btn-large">
                Browse Auctions
              </Link>
              <Link to="/create" className="btn btn-secondary btn-large">
                Create Auction
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Why FHEVM Auctions?</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon purple">
                <Lock size={32} />
              </div>
              <h3 className="feature-title">Fully Encrypted</h3>
              <p className="feature-description">
                All bid amounts encrypted using euint64. 
                Computed homomorphically without ever decrypting.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon yellow">
                <Shield size={32} />
              </div>
              <h3 className="feature-title">No Front-Running</h3>
              <p className="feature-description">
                Bids stay encrypted on-chain. 
                Impossible to see or manipulate until reveal.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon green">
                <Zap size={32} />
              </div>
              <h3 className="feature-title">Gateway Verified</h3>
              <p className="feature-description">
                Winner revealed via Zama Gateway callback. 
                Cryptographically proven fair selection.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <h2 className="cta-title">Ready to Start?</h2>
            <p className="cta-description">
              {account 
                ? "You're connected! Start exploring encrypted auctions."
                : "Connect your wallet to participate in FHEVM auctions."
              }
            </p>
            <Link to="/browse" className="btn btn-primary btn-large">
              Explore Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;