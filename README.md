# P2P Escrow on Arc

This repository contains a full-stack decentralized P2P marketplace on Arc’s EVM-compatible L1. Sellers post generic USDC/EURC liquidity while buyers spin up trade sessions on-demand. Arc’s stablecoin-native fees provide deterministic gas costs, so both escrow operations and tx fees stay in stable assets.

## Marketplace Workflow

1. **Seller listings** – Sellers post generic liquidity with `createListing(amount, price)`. No buyer is chosen upfront; liquidity remains in the seller wallet until a trade starts.
2. **Buyer sessions** – Any buyer can call `startTrade(listingId, amountRequested)`. This reduces the listing’s available liquidity and creates a trade that sits in `AwaitingSellerLock`.
3. **Seller lock** – The seller locks just that trade’s amount via `sellerLockFunds(tradeId)` (scripts/UI auto-approve USDC if needed).
4. **Buyer marks paid** – The buyer settles fiat off-chain, then calls `buyerMarkPaid(tradeId)`. A timeout deadline is stored on-chain.
5. **Release / refund** – Seller calls `sellerRelease(tradeId)` to deliver USDC. If the seller never releases, anyone can call `triggerTimeoutRefund(tradeId)` once the deadline passes, automatically returning the locked funds to the seller.

Events (`ListingCreated`, `TradeStarted`, `FundsLocked`, `TradeMarkedPaid`, `TradeReleased`, `TradeRefunded`) track every state change for indexers or bots.

## Hardhat usage

```bash
npm install

# run full suite with expanded edge cases
npx hardhat test

# deploy to Arc testnet (https://docs.arc.network/arc/concepts/welcome-to-arc)
STABLECOIN_ADDRESS=0x... npx hardhat run scripts/deploy.js --network arcTestnet

# seller creates a listing
ESCROW_ADDRESS=0xEscrow AMOUNT=10000000 PRICE=10100000 \
npx hardhat run scripts/createListing.js --network arcTestnet

# buyer opens a trade by referencing a listing
ESCROW_ADDRESS=0xEscrow LISTING_ID=1 AMOUNT=5000000 \
npx hardhat run scripts/startTrade.js --network arcTestnet

# seller locks only that trade’s amount (auto-approves when needed)
ESCROW_ADDRESS=0xEscrow TRADE_ID=1 npx hardhat run scripts/sellerLock.js --network arcTestnet

# buyer marks fiat leg complete
ESCROW_ADDRESS=0xEscrow TRADE_ID=1 npx hardhat run scripts/buyerMarkPaid.js --network arcTestnet

# seller releases or anyone triggers timeout refund
ESCROW_ADDRESS=0xEscrow TRADE_ID=1 npx hardhat run scripts/release.js --network arcTestnet
ESCROW_ADDRESS=0xEscrow TRADE_ID=1 npx hardhat run scripts/refund.js --network arcTestnet
```

The Arc config inside `hardhat.config.js` reads `ARC_RPC_URL`, `ARC_CHAIN_ID` (defaults to `67810`), and the seller key (`PRIVATE_KEY`). Arc’s stable-fee design requires the smart wallet to hold USDC/EURC for both liquidity and gas.

## Frontend (React + wagmi)

The `frontend/` directory contains a Vite/React dashboard that uses wagmi/viem for Arc wallet connectivity:

```bash
cd frontend
npm install
npm run dev
```

- **Buyers tab** (default): lists all active listings, with a “Start Trade” modal that calls `startTrade`. Buyer trades display live statuses (AwaitingSellerLock → Locked → Paid → Released/Refunded) and provide a `Mark Paid` button.
- **Sellers tab**: create listings, view remaining liquidity, and manage every trade session with contextual actions (*Lock Funds*, *Release*, *Timeout Refund*). The UI automatically handles USDC approvals before locking.
- Toasts, disabled buttons, and inline loaders show pending/success/error states, while wagmi/viem contract watchers refresh data in real time.

## Environment variables

```
# Hardhat / scripts
PRIVATE_KEY=0xabc...             # wallet funded with Arc testnet USDC (gas + liquidity)
ARC_RPC_URL=https://rpc-testnet.arc.network
ARC_CHAIN_ID=5042002
STABLECOIN_ADDRESS=0x...         # USDC/EURC token on Arc
ESCROW_ADDRESS=0x...             # filled after deployment for scripts

# Frontend (Vite)
VITE_ARC_RPC_URL=https://rpc.testnet.arc.network
VITE_ARC_CHAIN_ID=5042002
VITE_ESCROW_ADDRESS=0x...
VITE_STABLECOIN_ADDRESS=0x...    # optional override for auto-approval
```

## Docs & references

- Arc overview: https://docs.arc.network/arc/concepts/welcome-to-arc
- Stablecoin-native fees let every interaction above execute deterministically in USDC/EURC with ~sub-second finality, keeping settlement aligned with off-chain fiat flows.

Arc docs: https://docs.arc.network/arc/concepts/welcome-to-arc (EVM compatibility, stable fee design, deterministic finality). Use the Circle faucet linked in the docs to source testnet USDC for both escrow liquidity and transaction fees.

