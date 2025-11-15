export const TradeStatus = {
  None: 0,
  AwaitingSellerLock: 1,
  Locked: 2,
  Paid: 3,
  Released: 4,
  Refunded: 5,
} as const;

export type TradeStatus = (typeof TradeStatus)[keyof typeof TradeStatus];

export type Listing = {
  id: bigint;
  seller: `0x${string}`;
  availableAmount: bigint;
  price: bigint;
  active: boolean;
};

export type Trade = {
  id: bigint;
  listingId: bigint;
  seller: `0x${string}`;
  buyer: `0x${string}`;
  amount: bigint;
  timeout: bigint;
  status: TradeStatus;
};

