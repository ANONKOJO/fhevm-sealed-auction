import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { Clock, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/constants';
import './AuctionDetail.css';

const AuctionDetail = ({ account, signer, fhevmInstance }) => {
  const { id } = useParams();
  useEffect(() => {
  console.log('AuctionDetail - fhevmInstance:', fhevmInstance);
  console.log('AuctionDetail - account:', account);
  console.log('AuctionDetail - signer:', signer);
}, [fhevmInstance, account, signer]);
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAuction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, signer]);

  const loadAuction = async () => {
    try {
      setLoading(true);
      
      const provider = signer || new ethers.JsonRpcProvider(
        'https://sepolia.infura.io/v3/' + process.env.REACT_APP_INFURA_KEY
      );
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const auctionData = await contract.getAuction(id);
      const isActive = await contract.isAuctionActive(id);

      setAuction({
        id: id,
        seller: auctionData[0],
        title: auctionData[1],
        description: auctionData[2],
        minBid: ethers.formatEther(auctionData[3]),
        endTime: Number(auctionData[4]),
        finalized: auctionData[5],
        winner: auctionData[6],
        winningBid: ethers.formatEther(auctionData[7]),
        totalBids: Number(auctionData[8]),
        isActive: isActive
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading auction:', error);
      setLoading(false);
    }
  };

  const formatTimeLeft = (endTime) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = endTime - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

const handlePlaceBid = async (e) => {
  e.preventDefault();

  if (!account || !signer) {
    alert('Please connect your wallet');
    return;
  }

  if (!fhevmInstance) {
    alert('FHE instance not initialized. Please refresh and reconnect your wallet.');
    return;
  }

  if (!bidAmount) {
    alert('Please enter bid amount');
    return;
  }

  if (parseFloat(bidAmount) < parseFloat(auction.minBid)) {
    alert(`Bid must be at least ${auction.minBid} ETH`);
    return;
  }

  try {
    setSubmitting(true);
    
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    // Convert ETH to Wei
    const bidWei = ethers.parseEther(bidAmount);
    const bidValue = Number(bidWei);
    
    console.log('Bid amount:', bidAmount, 'ETH');
    console.log('Bid amount in Wei:', bidValue);
    
    // Encrypt using fhevmjs
    console.log('Encrypting bid with fhevmjs...');
    const encryptedBid = await fhevmInstance.encrypt64(bidValue);
    
    console.log('Encrypted data:', encryptedBid);
    console.log('Submitting encrypted bid to contract...');
    
    // Place the bid with encrypted data and proof
    const tx = await contract.placeBid(
      id,
      encryptedBid.handles[0],  // The encrypted euint64 handle
      encryptedBid.inputProof    // The cryptographic proof
    );
    
    console.log('Transaction sent:', tx.hash);
    await tx.wait();
    console.log('Bid placed successfully!');

    alert('✅ Encrypted bid submitted successfully!');
    setShowBidModal(false);
    setBidAmount('');
    loadAuction();
  } catch (error) {
    console.error('Error placing bid:', error);
    alert('Failed to place bid: ' + error.message);
  } finally {
    setSubmitting(false);
  }
};

  const handleRevealWinner = async () => {
    if (!account || !signer) {
      alert('Please connect your wallet');
      return;
    }

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      console.log('Requesting winner reveal...');
      const tx = await contract.requestWinnerReveal(id);
      
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      
      alert('✅ Winner reveal requested! The Zama gateway will process the decryption.');
      loadAuction();
    } catch (error) {
      console.error('Error revealing winner:', error);
      alert('Failed to reveal winner: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="auction-detail">
        <div className="container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="auction-detail">
        <div className="container">
          <div className="empty-state">
            <h3>Auction not found</h3>
            <Link to="/browse" className="btn btn-primary">
              Back to Browse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-detail">
      <div className="back-nav">
        <div className="container">
          <Link to="/browse" className="back-link">
            <ArrowLeft size={20} />
            Back to Browse
          </Link>
        </div>
      </div>

      <div className="auction-detail-header">
        <div className="container">
          <div className="auction-detail-meta">
            <div className={`auction-status-badge ${auction.isActive ? 'active' : 'ended'}`}>
              {auction.isActive ? '🟢 Live Auction' : '⚫ Ended'}
            </div>
            <div className="auction-id-badge">Auction #{auction.id}</div>
          </div>
          <h1 className="auction-detail-title">{auction.title}</h1>
          <p className="auction-detail-description">{auction.description}</p>
        </div>
      </div>

      <div className="container">
        <div className="auction-detail-grid">
          <div className="auction-stats-column">
            <div className="stat-card primary">
              <div className="stat-label">Minimum Bid</div>
              <div className="stat-value">{auction.minBid} ETH</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Clock size={20} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Time Remaining</div>
                <div className="stat-value small">
                  {formatTimeLeft(auction.endTime)}
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                <Lock size={20} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Encrypted Bids (euint64)</div>
                <div className="stat-value small">{auction.totalBids}</div>
              </div>
            </div>

            {auction.finalized && auction.winner && (
              <div className="winner-card">
                <div>
                  <div className="winner-label">Winner</div>
                  <div className="winner-address">
                    {auction.winner.slice(0, 6)}...{auction.winner.slice(-4)}
                  </div>
                  <div className="winner-bid">{auction.winningBid} ETH</div>
                </div>
              </div>
            )}
          </div>

          <div className="auction-actions-column">
            <div className="action-card">
              <h3>Place Your Bid</h3>
              
              <div className="info-banner">
                <Lock size={18} />
                <div>
                  <strong>FHEVM Encrypted</strong>
                  <p>Your bid is encrypted with euint64 on-chain using FHE.</p>
                </div>
              </div>

              {auction.isActive ? (
               <button 
  onClick={() => setShowBidModal(true)}
  className="btn btn-primary btn-large"
  disabled={!account}
>
  {!account ? 'Connect Wallet to Bid' : 'Place Bid (Demo)'}
</button>
              ) : (
                <>
                  {!auction.finalized && auction.totalBids > 0 && (
                    <button 
                      onClick={handleRevealWinner}
                      className="btn btn-secondary btn-large"
                      disabled={!account}
                    >
                      Reveal Winner via Gateway
                    </button>
                  )}
                  {auction.finalized && (
                    <div className="finalized-message">
                      ✅ Winner revealed via Zama Gateway
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showBidModal && (
        <div className="modal-overlay" onClick={() => setShowBidModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Place Encrypted Bid</h3>
              <button 
                onClick={() => setShowBidModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePlaceBid}>
              <div className="modal-body">
                <div className="alert-box">
                  <AlertCircle size={20} />
                  <div>
                    <strong>FHE Privacy:</strong> Your bid will be encrypted using euint64 and processed homomorphically.
                  </div>
                </div>

                <div className="form-group">
                  <label>Bid Amount (ETH)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={auction.minBid}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Min: ${auction.minBid} ETH`}
                    required
                  />
                  <small>Minimum bid: {auction.minBid} ETH</small>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  onClick={() => setShowBidModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Encrypting & Submitting...' : 'Submit Encrypted Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionDetail;