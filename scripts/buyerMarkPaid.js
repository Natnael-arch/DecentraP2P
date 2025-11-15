import hre from "hardhat";

const { ethers } = hre;

async function main() {
  const { ESCROW_ADDRESS, TRADE_ID } = process.env;
  if (!ESCROW_ADDRESS || !TRADE_ID) {
    throw new Error("Set ESCROW_ADDRESS and TRADE_ID env vars.");
  }

  const escrow = await ethers.getContractAt("P2PEscrow", ESCROW_ADDRESS);
  const tx = await escrow.buyerMarkPaid(TRADE_ID);
  await tx.wait();
  console.log(`Buyer marked trade ${TRADE_ID} as paid`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

