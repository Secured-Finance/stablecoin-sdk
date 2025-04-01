import "colors";
import "dotenv/config";

import { Wallet } from "@ethersproject/wallet";

import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import { HardhatUserConfig } from "hardhat/config";

const deployerAccount = process.env.DEPLOYER_PRIVATE_KEY || Wallet.createRandom().privateKey;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100
          }
        }
      }
    ]
  },

  namedAccounts: {
    deployer: 0
  },

  networks: {
    hardhat: {},

    testnet: {
      url: process.env.TESTNET_RPC_ENDPOINT || "http://localhost:8545",
      accounts: [deployerAccount]
    },

    mainnet: {
      url: process.env.MAINNET_RPC_ENDPOINT || "http://localhost:8545",
      accounts: [deployerAccount]
    }
  }
};

export default config;
