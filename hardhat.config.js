import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const ARC_RPC_URL = process.env.ARC_RPC_URL || "https://rpc-testnet.arc.network";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    arcTestnet: {
      url: ARC_RPC_URL,
      chainId: Number(process.env.ARC_CHAIN_ID || 5042002),
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};

export default config;

