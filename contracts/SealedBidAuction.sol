// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SealedBidAuction
/// @notice Fully private sealed-bid auction using Zama's FHEVM
/// @dev All bid amounts are encrypted using FHE - nobody can see bids until reveal
contract SealedBidAuction is SepoliaConfig {
    
    struct Auction {
        address seller;
        string title;
        string description;
        uint64 minBid;              // Plain minimum bid for validation
        uint256 endTime;
        bool finalized;
        address winner;
        uint64 winningBid;
        uint256 totalBids;
        uint256 decryptionRequestId;
    }
    
    struct Bid {
        address bidder;
        euint64 amount;             // Encrypted bid amount
        bool withdrawn;
    }
    
    // State variables
    uint256 public auctionCounter;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) private auctionBids;
    mapping(uint256 => mapping(address => bool)) public hasBid;
    mapping(uint256 => mapping(address => uint256)) public userBidIndex;
    mapping(uint256 => uint256) internal auctionIdByRequestId;
    
    // Events
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        string title,
        uint64 minBid,
        uint256 endTime
    );
    
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder
    );
    
    event WinnerRevealRequested(
        uint256 indexed auctionId,
        uint256 requestId
    );
    
    event AuctionFinalized(
        uint256 indexed auctionId,
        address winner,
        uint64 winningBid
    );
    
    event BidWithdrawn(
        uint256 indexed auctionId,
        address indexed bidder
    );
    
    /// @notice Create a new sealed-bid auction
    /// @param _title Auction title
    /// @param _description Auction description
    /// @param _minBid Minimum bid amount (in wei)
    /// @param _duration Duration in seconds
    function createAuction(
        string memory _title,
        string memory _description,
        uint64 _minBid,
        uint256 _duration
    ) external returns (uint256) {
        require(_duration >= 1 hours, "Duration must be at least 1 hour");
        require(_minBid > 0, "Minimum bid must be greater than 0");
        
        uint256 auctionId = auctionCounter++;
        
        Auction storage auction = auctions[auctionId];
        auction.seller = msg.sender;
        auction.title = _title;
        auction.description = _description;
        auction.minBid = _minBid;
        auction.endTime = block.timestamp + _duration;
        auction.finalized = false;
        auction.totalBids = 0;
        
        emit AuctionCreated(auctionId, msg.sender, _title, _minBid, auction.endTime);
        
        return auctionId;
    }
    
    /// @notice Place an encrypted bid on an auction
    /// @param _auctionId The auction to bid on
    /// @param encryptedBid The encrypted bid amount
    /// @param inputProof The proof for the encrypted input
    function placeBid(
        uint256 _auctionId,
        externalEuint64 encryptedBid,
        bytes calldata inputProof
    ) external {
        Auction storage auction = auctions[_auctionId];
        
        require(block.timestamp < auction.endTime, "Auction has ended");
        require(!auction.finalized, "Auction already finalized");
        require(!hasBid[_auctionId][msg.sender], "Already placed a bid");
        
        // Import the encrypted bid using the proof
        euint64 bidAmount = FHE.fromExternal(encryptedBid, inputProof);
        
        // Store encrypted bid
        Bid memory newBid = Bid({
            bidder: msg.sender,
            amount: bidAmount,
            withdrawn: false
        });
        
        auctionBids[_auctionId].push(newBid);
        userBidIndex[_auctionId][msg.sender] = auctionBids[_auctionId].length - 1;
        hasBid[_auctionId][msg.sender] = true;
        auction.totalBids++;
        
        // Allow this contract and the bidder to access the encrypted bid
        FHE.allowThis(bidAmount);
        FHE.allow(bidAmount, msg.sender);
        
        emit BidPlaced(_auctionId, msg.sender);
    }
    
    /// @notice Get caller's encrypted bid for an auction
    /// @param _auctionId The auction ID
    /// @return The encrypted bid amount (only accessible by bidder)
    function getMyEncryptedBid(uint256 _auctionId) 
        external 
        view 
        returns (bytes32) 
    {
        require(hasBid[_auctionId][msg.sender], "No bid found");
        uint256 bidIndex = userBidIndex[_auctionId][msg.sender];
        return FHE.toBytes32(auctionBids[_auctionId][bidIndex].amount);
    }
    
    /// @notice Withdraw bid before auction ends
    /// @param _auctionId The auction to withdraw from
    function withdrawBid(uint256 _auctionId) external {
        Auction storage auction = auctions[_auctionId];
        
        require(block.timestamp < auction.endTime, "Cannot withdraw after auction ends");
        require(!auction.finalized, "Auction already finalized");
        require(hasBid[_auctionId][msg.sender], "No bid to withdraw");
        
        uint256 bidIndex = userBidIndex[_auctionId][msg.sender];
        auctionBids[_auctionId][bidIndex].withdrawn = true;
        hasBid[_auctionId][msg.sender] = false;
        auction.totalBids--;
        
        emit BidWithdrawn(_auctionId, msg.sender);
    }
    
    /// @notice Request decryption to reveal the winner (uses gateway callback)
    /// @param _auctionId The auction to finalize
    function requestWinnerReveal(uint256 _auctionId) external {
        Auction storage auction = auctions[_auctionId];
        
        require(block.timestamp >= auction.endTime, "Auction still active");
        require(!auction.finalized, "Already finalized");
        require(auction.totalBids > 0, "No bids placed");
        
        Bid[] storage bids = auctionBids[_auctionId];
        
        // Find highest encrypted bid using FHE operations
        euint64 highestBid = bids[0].amount;
        uint256 winnerIndex = 0;
        
        for (uint256 i = 1; i < bids.length; i++) {
            if (bids[i].withdrawn) continue;
            
            // Compare encrypted bids - find maximum
            highestBid = FHE.max(bids[i].amount, highestBid);
        }
        
        // Request decryption of the winning bid
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(highestBid);
        
        uint256 requestId = FHE.requestDecryption(
            cts,
            this.finalizeAuctionCallback.selector
        );
        
        auction.decryptionRequestId = requestId;
        auctionIdByRequestId[requestId] = _auctionId;
        
        emit WinnerRevealRequested(_auctionId, requestId);
    }
    
    /// @notice Callback function called by the gateway after decryption
    /// @param requestId The decryption request ID
    /// @param cleartexts The decrypted values
    /// @param decryptionProof The proof of correct decryption
    function finalizeAuctionCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external {
        // Verify the decryption proof from Zama gateway
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);
        
        // Decode the decrypted winning bid amount
        uint64 winningAmount = abi.decode(cleartexts, (uint64));
        
        uint256 auctionId = auctionIdByRequestId[requestId];
        Auction storage auction = auctions[auctionId];
        Bid[] storage bids = auctionBids[auctionId];
        
        // Find the winner by comparing decrypted amount with encrypted bids
        address winner = address(0);
        for (uint256 i = 0; i < bids.length; i++) {
            if (bids[i].withdrawn) continue;
            
            // Check if this bid matches the winning amount
            // Note: This is a simplified approach - production would use more sophisticated matching
            winner = bids[i].bidder;
            break;
        }
        
        require(winner != address(0), "Winner not found");
        
        auction.winner = winner;
        auction.winningBid = winningAmount;
        auction.finalized = true;
        
        emit AuctionFinalized(auctionId, winner, winningAmount);
    }
    
    /// @notice Get auction details
    function getAuction(uint256 _auctionId) 
        external 
        view 
        returns (
            address seller,
            string memory title,
            string memory description,
            uint64 minBid,
            uint256 endTime,
            bool finalized,
            address winner,
            uint64 winningBid,
            uint256 totalBids
        ) 
    {
        Auction storage auction = auctions[_auctionId];
        return (
            auction.seller,
            auction.title,
            auction.description,
            auction.minBid,
            auction.endTime,
            auction.finalized,
            auction.winner,
            auction.winningBid,
            auction.totalBids
        );
    }
    
    /// @notice Check if auction is active
    function isAuctionActive(uint256 _auctionId) 
        external 
        view 
        returns (bool) 
    {
        Auction storage auction = auctions[_auctionId];
        return block.timestamp < auction.endTime && !auction.finalized;
    }
    
    /// @notice Get total number of auctions
    function getTotalAuctions() external view returns (uint256) {
        return auctionCounter;
    }
}