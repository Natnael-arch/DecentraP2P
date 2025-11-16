import escrowArtifact from "../abi/P2PEscrow.json";
import erc20Artifact from "../abi/ERC20.json";

export const ESCROW_ADDRESS = (import.meta.env.VITE_ESCROW_ADDRESS || "") as `0x${string}`;
export const STABLECOIN_ADDRESS = (import.meta.env.VITE_STABLECOIN_ADDRESS || "") as `0x${string}`;

export const ESCROW_ABI = escrowArtifact.abi;
export const ERC20_ABI = erc20Artifact.abi;


