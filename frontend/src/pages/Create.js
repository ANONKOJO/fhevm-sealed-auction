import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { AlertCircle, Loader } from 'lucide-react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/constants';
import './Create.css';

const Create = ({ account, signer }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    minBid: '',
    duration: '24'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!account || !signer) {
      alert('Please connect your wallet first');
      return;
    }

    if (!formData.title || !formData.minBid) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const minBidWei = ethers.parseEther(formData.minBid);
      const durationSeconds = parseInt(formData.duration) * 3600;

      const tx = await contract.createAuction(
        formData.title,
        formData.description,
        minBidWei,
        durationSeconds
      );

      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Auction created!');

      alert('✅ FHEVM Auction created successfully!');
      navigate('/browse');
    } catch (error) {
      console.error('Error creating auction:', error);
      alert('Failed to create auction: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create">
      <div className="create-header">
        <div className="container">
          <h1 className="page-title">Create FHEVM Auction</h1>
          <p className="page-subtitle">
            All bids will be encrypted with euint64. Nobody will see bid amounts until reveal.
          </p>
        </div>
      </div>

      <div className="container">
        <div className="create-content">
          <form onSubmit={handleSubmit} className="create-form">
            <div className="form-group">
              <label htmlFor="title">
                Auction Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Rare NFT Collection #1234"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your item..."
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="minBid">
                  Minimum Bid (ETH) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="minBid"
                  name="minBid"
                  value={formData.minBid}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="duration">
                  Duration <span className="required">*</span>
                </label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                >
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="12">12 hours</option>
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                </select>
              </div>
            </div>

            <div className="info-box">
              <AlertCircle size={20} />
              <div>
                <strong>FHEVM Privacy:</strong> All bids will be encrypted using euint64. 
                Bidders' amounts remain completely hidden using FHE until you reveal the winner.
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-large"
              disabled={loading || !account}
            >
              {loading ? (
                <>
                  <Loader className="spinner-icon" size={20} />
                  Creating Auction...
                </>
              ) : (
                'Create FHEVM Auction'
              )}
            </button>

            {!account && (
              <p className="connect-prompt">
                Please connect your wallet to create an auction
              </p>
            )}
          </form>

          <div className="create-sidebar">
            <div className="preview-card">
              <h3>Preview</h3>
              <div className="preview-content">
                <div className="preview-title">
                  {formData.title || 'Your Auction Title'}
                </div>
                <div className="preview-description">
                  {formData.description || 'Your auction description...'}
                </div>
                <div className="preview-details">
                  <div className="preview-detail">
                    <span className="detail-label">Minimum Bid</span>
                    <span className="detail-value">
                      {formData.minBid || '0.00'} ETH
                    </span>
                  </div>
                  <div className="preview-detail">
                    <span className="detail-label">Duration</span>
                    <span className="detail-value">
                      {formData.duration} hours
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Create;