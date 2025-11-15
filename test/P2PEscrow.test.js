import { expect } from "chai";
import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

const { ethers } = hre;

const AMOUNT = ethers.parseUnits("100", 6);
const REQUEST = ethers.parseUnits("40", 6);
const PRICE = 1000n * 10n ** 6n;
const TIMEOUT = 60 * 60; // 1 hour

async function deployFixture() {
  const [deployer, seller, buyer, other] = await ethers.getSigners();

  const token = await ethers.deployContract("MockERC20", ["Mock USD", "mUSD", 6]);
  await token.waitForDeployment();
  await token.connect(deployer).mint(seller.address, AMOUNT * 5n);

  const escrow = await ethers.deployContract("P2PEscrow", [await token.getAddress(), TIMEOUT]);
  await escrow.waitForDeployment();

  return { escrow, token, seller, buyer, other };
}

async function createListing(escrow, seller) {
  const tx = await escrow.connect(seller).createListing(AMOUNT, PRICE);
  await tx.wait();
}

async function startTrade(escrow, buyer, listingId, amount = REQUEST) {
  const tx = await escrow.connect(buyer).startTrade(listingId, amount);
  const receipt = await tx.wait();
  const tradeId = receipt.logs
    .map((log) => {
      try {
        return escrow.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed && parsed.name === "TradeStarted")?.args.tradeId;
  return tradeId;
}

describe("P2PEscrow marketplace", function () {
  it("creates listing and reduces liquidity when trade starts", async function () {
    const { escrow, seller, buyer } = await loadFixture(deployFixture);

    await createListing(escrow, seller);
    const listingBefore = await escrow.getListing(1);
    expect(listingBefore.availableAmount).to.equal(AMOUNT);

    await startTrade(escrow, buyer, 1, REQUEST);

    const listingAfter = await escrow.getListing(1);
    expect(listingAfter.availableAmount).to.equal(AMOUNT - REQUEST);
  });

  it("handles full trade lifecycle", async function () {
    const { escrow, token, seller, buyer } = await loadFixture(deployFixture);

    await createListing(escrow, seller);
    const tradeId = await startTrade(escrow, buyer, 1, REQUEST);

    await token.connect(seller).approve(await escrow.getAddress(), REQUEST);
    await expect(escrow.connect(seller).sellerLockFunds(tradeId))
      .to.emit(escrow, "FundsLocked")
      .withArgs(tradeId, seller.address, REQUEST);

    await expect(escrow.connect(buyer).buyerMarkPaid(tradeId)).to.emit(escrow, "TradeMarkedPaid");

    await expect(escrow.connect(seller).sellerRelease(tradeId))
      .to.emit(escrow, "TradeReleased")
      .withArgs(tradeId, buyer.address, REQUEST);

    expect(await token.balanceOf(buyer.address)).to.equal(REQUEST);
  });

  it("deactivates listing when liquidity is drained", async function () {
    const { escrow, seller, buyer } = await loadFixture(deployFixture);

    await createListing(escrow, seller);
    await startTrade(escrow, buyer, 1, AMOUNT);

    const listing = await escrow.getListing(1);
    expect(listing.availableAmount).to.equal(0);
    expect(listing.active).to.equal(false);
  });

  it("refunds seller after timeout if not released", async function () {
    const { escrow, token, seller, buyer, other } = await loadFixture(deployFixture);

    await createListing(escrow, seller);
    const tradeId = await startTrade(escrow, buyer, 1);

    await token.connect(seller).approve(await escrow.getAddress(), REQUEST);
    await escrow.connect(seller).sellerLockFunds(tradeId);
    await escrow.connect(buyer).buyerMarkPaid(tradeId);

    await time.increase(TIMEOUT + 1);

    await expect(escrow.connect(other).triggerTimeoutRefund(tradeId))
      .to.emit(escrow, "TradeRefunded")
      .withArgs(tradeId, seller.address, REQUEST);

    expect(await token.balanceOf(seller.address)).to.equal(AMOUNT * 5n);
  });

  it("reverts when listing lacks liquidity", async function () {
    const { escrow, seller, buyer } = await loadFixture(deployFixture);

    await createListing(escrow, seller);
    await startTrade(escrow, buyer, 1, AMOUNT);

    await expect(escrow.connect(buyer).startTrade(1, 1)).to.be.revertedWithCustomError(escrow, "ListingInactive");
  });

  it("blocks unauthorized calls", async function () {
    const { escrow, token, seller, buyer, other } = await loadFixture(deployFixture);

    await createListing(escrow, seller);
    const tradeId = await startTrade(escrow, buyer, 1);

    await token.connect(seller).approve(await escrow.getAddress(), REQUEST);

    await expect(escrow.connect(other).sellerLockFunds(tradeId)).to.be.revertedWithCustomError(escrow, "Unauthorized");

    await escrow.connect(seller).sellerLockFunds(tradeId);
    await expect(escrow.connect(other).buyerMarkPaid(tradeId)).to.be.revertedWithCustomError(escrow, "Unauthorized");
  });

  it("prevents double release", async function () {
    const { escrow, token, seller, buyer } = await loadFixture(deployFixture);

    await createListing(escrow, seller);
    const tradeId = await startTrade(escrow, buyer, 1);

    await token.connect(seller).approve(await escrow.getAddress(), REQUEST);
    await escrow.connect(seller).sellerLockFunds(tradeId);
    await escrow.connect(buyer).buyerMarkPaid(tradeId);
    await escrow.connect(seller).sellerRelease(tradeId);

    await expect(escrow.connect(seller).sellerRelease(tradeId)).to.be.revertedWithCustomError(escrow, "InvalidStatus");
  });
});

