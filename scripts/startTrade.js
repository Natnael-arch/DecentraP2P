import hre from "hardhat";

const { ethers } = hre;

async function main() {
  const { ESCROW_ADDRESS, LISTING_ID, AMOUNT } = process.env;
  if (!ESCROW_ADDRESS || !LISTING_ID || !AMOUNT) {
    throw new Error("Set ESCROW_ADDRESS, LISTING_ID, AMOUNT env vars.");
  }

  const escrow = await ethers.getContractAt("P2PEscrow", ESCROW_ADDRESS);
  const tx = await escrow.startTrade(Number(LISTING_ID), BigInt(AMOUNT));
  const receipt = await tx.wait();
  const event = receipt.logs
    .map((log) => {
      try {
        return escrow.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed && parsed.name === "TradeStarted");

  if (!event) throw new Error("TradeStarted event not found");
  console.log(
    `Trade ${event.args.tradeId} created for listing ${event.args.listingId} amount ${event.args.amount} by ${event.args.buyer}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

