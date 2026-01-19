const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment...");
  
  // Get the contract factory
  const StudentCertificate = await hre.ethers.getContractFactory("StudentCertificate");
  
  // Deploy the contract
  console.log("📦 Deploying StudentCertificate contract...");
  const certificate = await StudentCertificate.deploy();
  
  await certificate.waitForDeployment();
  
  const contractAddress = await certificate.getAddress();
  console.log("✅ StudentCertificate deployed to:", contractAddress);
  
  // Get deployer info
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deployed by:", deployer.address);
  console.log("🌐 Network:", hre.network.name);
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info to JSON
  const deploymentPath = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment info saved to:", deploymentPath);
  
  // Save ABI
  const artifact = await hre.artifacts.readArtifact("StudentCertificate");
  const abiPath = path.join(deploymentsDir, "StudentCertificate.abi.json");
  fs.writeFileSync(
    abiPath,
    JSON.stringify(artifact.abi, null, 2)
  );
  console.log("📄 ABI saved to:", abiPath);
  
  // Also save to backend directory if running in Docker
  const backendAbiPath = path.join(__dirname, "..", "..", "backend", "StudentCertificate.abi.json");
  try {
    fs.writeFileSync(backendAbiPath, JSON.stringify(artifact.abi, null, 2));
    console.log("📄 ABI copied to backend:", backendAbiPath);
  } catch (error) {
    console.log("ℹ️  Could not copy ABI to backend (may not be needed)");
  }
  
  // Verify on Etherscan/Polygonscan (only on public networks)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("⏳ Waiting for block confirmations...");
    await certificate.deploymentTransaction().wait(6);
    
    console.log("🔍 Verifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }
  
  console.log("\n📋 Deployment Summary:");
  console.log("=".repeat(50));
  console.log("Contract Address:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("=".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
