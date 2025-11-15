import hre from "hardhat";

const { ethers } = hre;

async function main() {
  const stablecoinAddress = process.env.STABLECOIN_ADDRESS;
  const paymentTimeout = Number(process.env.PAYMENT_TIMEOUT || 3600);
  if (!stablecoinAddress) {
    throw new Error("Set STABLECOIN_ADDRESS to the USDC/EURC contract address on Arc.");
  }

  const factory = await ethers.getContractFactory("P2PEscrow");
  const contract = await factory.deploy(stablecoinAddress, paymentTimeout);
  await contract.waitForDeployment();

  console.log(`P2PEscrow deployed at ${contract.target} with timeout ${paymentTimeout}s`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
