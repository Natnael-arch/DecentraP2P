import hre from "hardhat";

const { ethers } = hre;

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

async function main() {
  const { ESCROW_ADDRESS, TRADE_ID, AUTO_APPROVE = "true" } = process.env;
  if (!ESCROW_ADDRESS || !TRADE_ID) {
    throw new Error("Set ESCROW_ADDRESS and TRADE_ID env vars.");
  }

  const escrow = await ethers.getContractAt("P2PEscrow", ESCROW_ADDRESS);
  const trade = await escrow.getTrade(TRADE_ID);

  const signer = await ethers.getSigner();
  const seller = await signer.getAddress();
  if (seller.toLowerCase() !== trade.seller.toLowerCase()) {
    throw new Error("Connected wallet is not the trade seller");
  }

  if (AUTO_APPROVE === "true") {
    const stablecoinAddress = await escrow.stablecoin();
    const token = new ethers.Contract(stablecoinAddress, ERC20_ABI, signer);
    const allowance = await token.allowance(seller, ESCROW_ADDRESS);
    if (allowance < trade.amount) {
      const approveTx = await token.approve(ESCROW_ADDRESS, trade.amount);
      await approveTx.wait();
      console.log(`Approved ${trade.amount} tokens to escrow`);
    }
  }

  const tx = await escrow.sellerLockFunds(TRADE_ID);
  await tx.wait();
  console.log(`Locked ${trade.amount} tokens for trade ${TRADE_ID}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

