// FHEVM Sealed-Bid Auction Contract
export const CONTRACT_ADDRESS = "0x623e2A23950FcEc7E0D4f0653555301Daa04F8E9";

export const CONTRACT_ABI = [
  "function createAuction(string memory _title, string memory _description, uint64 _minBid, uint256 _duration) external returns (uint256)",
  "function placeBid(uint256 _auctionId, bytes calldata encryptedBid, bytes calldata inputProof) external",
  "function requestWinnerReveal(uint256 _auctionId) external",
  "function withdrawBid(uint256 _auctionId) external",
  "function getAuction(uint256 _auctionId) external view returns (address seller, string memory title, string memory description, uint64 minBid, uint256 endTime, bool finalized, address winner, uint64 winningBid, uint256 totalBids)",
  "function getMyEncryptedBid(uint256 _auctionId) external view returns (bytes32)",
  "function isAuctionActive(uint256 _auctionId) external view returns (bool)",
  "function getTotalAuctions() external view returns (uint256)",
  "event AuctionCreated(uint256 indexed auctionId, address indexed seller, string title, uint64 minBid, uint256 endTime)",
  "event BidPlaced(uint256 indexed auctionId, address indexed bidder)",
  "event AuctionFinalized(uint256 indexed auctionId, address winner, uint64 winningBid)"
];

export const SEPOLIA_CHAIN_ID = 11155111;

export const COLORS = {
  primary: '#FFD208',
  purple: '#8B5CF6',
  lightGray: '#F8FAFC',
  dark: '#1A1A1A',
  text: '#171717',
  white: '#FFFFFF'
};