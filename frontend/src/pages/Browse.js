import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { Clock, Lock, Trophy } from 'lucide-react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/constants';
import './Browse.css';

const Browse = ({ account, signer }) => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

useEffect(() => {
    loadAuctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer]);

  const loadAuctions = async () => {
    try {
      setLoading(true);
      
      if (!signer) {
        // Use provider for read-only
        const provider = new ethers.JsonRpcProvider(
          'https://sepolia.infura.io/v3/' + process.env.REACT_APP_INFURA_KEY
        );
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        await fetchAuctions(contract);
      } else {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        await fetchAuctions(contract);
      }
    } catch (error) {
      console.error('Error loading auctions:', error);
      setLoading(false);
    }
  };

  const fetchAuctions = async (contract) => {
    try {
      const totalAuctions = await contract.getTotalAuctions();
      const auctionsData = [];

      for (let i = 0; i < totalAuctions; i++) {
        try {
          const auction = await contract.getAuction(i);
          const isActive = await contract.isAuctionActive(i);
          
          auctionsData.push({
            id: i,
            seller: auction[0],
            title: auction[1],
            description: auction[2],
            minBid: ethers.formatEther(auction[3]),
            endTime: Number(auction[4]),
            finalized: auction[5],
            winner: auction[6],
            winningBid: ethers.formatEther(auction[7]),
            totalBids: Number(auction[8]),
            isActive: isActive
          });
        } catch (error) {
          console.error(`Error loading auction ${i}:`, error);
        }
      }

      setAuctions(auctionsData.reverse());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching auctions:', error);
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

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const filteredAuctions = auctions.filter(auction => {
    if (filter === 'active') return auction.isActive;
    if (filter === 'ended') return !auction.isActive;
    return true;
  });

  if (loading) {
    return (
      <div className="browse">
        <div className="container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="browse">
      <div className="browse-header">
        <div className="container">
          <h1 className="page-title">Browse FHEVM Auctions</h1>
          <p className="page-subtitle">
            All bids encrypted with euint64. Privacy guaranteed by FHE.
          </p>

          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({auctions.length})
            </button>
            <button 
              className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active ({auctions.filter(a => a.isActive).length})
            </button>
            <button 
              className={`filter-tab ${filter === 'ended' ? 'active' : ''}`}
              onClick={() => setFilter('ended')}
            >
              Ended ({auctions.filter(a => !a.isActive).length})
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {filteredAuctions.length === 0 ? (
          <div className="empty-state">
            <Lock size={64} color="#D1D5DB" />
            <h3>No auctions found</h3>
            <p>Be the first to create an FHEVM auction!</p>
            <Link to="/create" className="btn btn-primary">
              Create Auction
            </Link>
          </div>
        ) : (
          <div className="auctions-grid">
            {filteredAuctions.map(auction => (
              <Link 
                key={auction.id} 
                to={`/auction/${auction.id}`}
                className="auction-card"
              >
                <div className="auction-card-header">
                  <div className={`auction-status ${auction.isActive ? 'active' : 'ended'}`}>
                    {auction.isActive ? 'Live' : 'Ended'}
                  </div>
                  <div className="auction-id">#{auction.id}</div>
                </div>

                <h3 className="auction-title">{auction.title}</h3>
                <p className="auction-description">{auction.description}</p>

                <div className="auction-stats">
                  <div className="stat-item">
                    <Lock size={16} color="#8B5CF6" />
                    <span>{auction.totalBids} Encrypted Bids</span>
                  </div>
                  <div className="stat-item">
                    <Clock size={16} color="#6B7280" />
                    <span>{formatTimeLeft(auction.endTime)}</span>
                  </div>
                </div>

                <div className="auction-footer">
                  <div className="min-bid">
                    <div className="label">Minimum Bid</div>
                    <div className="value">{auction.minBid} ETH</div>
                  </div>

                  {auction.finalized && auction.winner && (
                    <div className="winner-badge">
                      <Trophy size={16} />
                      <span>{auction.winningBid} ETH</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;