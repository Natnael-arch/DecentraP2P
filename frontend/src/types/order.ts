export type Listing = {
  id: number;
  seller: string;
  availableAmount: bigint;
  price: bigint;
  active: boolean;
};

export type Trade = {
  id: number;
  listingId: number;
  seller: string;
  buyer: string;
  amount: bigint;
  timeout: number;
  status: number;
};

