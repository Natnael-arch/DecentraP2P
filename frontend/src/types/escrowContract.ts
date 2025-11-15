import type { Contract } from "ethers";

export type EscrowContract = Contract & {
  createListing(amount: bigint, price: bigint, timeout: number, buyer: string): Promise<unknown>;
  lockFunds(orderId: number): Promise<unknown>;
  markPaid(orderId: number): Promise<unknown>;
  confirmPayment(orderId: number): Promise<unknown>;
  triggerRefund(orderId: number): Promise<unknown>;
  orderCounter(): Promise<bigint>;
  getOrder(orderId: number): Promise<{
    seller: string;
    buyer: string;
    amount: bigint;
    price: bigint;
    timeoutPeriod: bigint;
    timeoutTimestamp: bigint;
    status: number;
  }>;
  stablecoin(): Promise<string>;
};

