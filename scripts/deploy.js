const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SealedBidAuction with FHEVM...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  const SealedBidAuction = await hre.ethers.getContractFactory("SealedBidAuction");
  const auction = await SealedBidAuction.deploy();
  await auction.waitForDeployment();
  
  const address = await auction.getAddress();
  console.log("✅ FHEVM Auction deployed to:", address);
  console.log("View:", `https://sepolia.etherscan.io/address/${address}\n`);
  
  console.log("Waiting for confirmations...");
  await auction.deploymentTransaction().wait(5);
  
  console.log("Verifying...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("✅ Verified!");
  } catch (error) {
    console.log("Note:", error.message);
  }
  
  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("Contract:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});