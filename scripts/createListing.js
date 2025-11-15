import hre from "hardhat";

const { ethers } = hre;

async function main() {
  const { ESCROW_ADDRESS, AMOUNT, PRICE } = process.env;
  if (!ESCROW_ADDRESS || !AMOUNT || !PRICE) {
    throw new Error("Set ESCROW_ADDRESS, AMOUNT, PRICE env vars.");
  }

  const escrow = await ethers.getContractAt("P2PEscrow", ESCROW_ADDRESS);
  const amount = BigInt(AMOUNT);
  const price = BigInt(PRICE);

  const tx = await escrow.createListing(amount, price);
  const receipt = await tx.wait();
  const event = receipt.logs
    .map((log) => {
      try {
        return escrow.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed && parsed.name === "ListingCreated");

  if (!event) throw new Error("ListingCreated event not found");
  console.log(
    `Listing ${event.args.listingId} created by ${event.args.seller} with ${event.args.amount} tokens @ price ${event.args.price}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

