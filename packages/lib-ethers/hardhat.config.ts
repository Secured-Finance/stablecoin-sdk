import "colors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { JsonFragment } from "@ethersproject/abi";
import { Signer } from "@ethersproject/abstract-signer";
import { ContractFactory, Overrides } from "@ethersproject/contracts";
import { Wallet } from "@ethersproject/wallet";

import "@nomiclabs/hardhat-ethers";
import { extendEnvironment, HardhatUserConfig, task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { _ProtocolDeploymentJSON } from "./src/contracts";
import { deployAndSetupContracts } from "./utils/deploy";

import accounts from "./accounts.json";

dotenv.config();

const numAccounts = 100;

const useLiveVersionEnv = (process.env.USE_LIVE_VERSION ?? "false").toLowerCase();
const useLiveVersion = !["false", "no", "0"].includes(useLiveVersionEnv);

const contractsDir = path.join("..", "contracts");
const artifacts = path.join(contractsDir, "artifacts");
const cache = path.join(contractsDir, "cache");

const contractsVersion = fs
  .readFileSync(path.join(useLiveVersion ? "live" : artifacts, "version"))
  .toString()
  .trim();

if (useLiveVersion) {
  console.log(`Using live version of contracts (${contractsVersion}).`.cyan);
}

const generateRandomAccounts = (numberOfAccounts: number) => {
  const accounts = new Array<string>(numberOfAccounts);

  for (let i = 0; i < numberOfAccounts; ++i) {
    accounts[i] = Wallet.createRandom().privateKey;
  }

  return accounts;
};

const deployerAccount = process.env.DEPLOYER_PRIVATE_KEY || Wallet.createRandom().privateKey;
const devChainRichAccount = "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7";

// https://docs.chain.link/docs/ethereum-addresses
// https://docs.tellor.io/tellor/integration/reference-page

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      accounts: accounts.slice(0, numAccounts),

      gas: 12e6, // tx gas limit
      blockGasLimit: 12e6,

      // Let Ethers throw instead of Buidler EVM
      // This is closer to what will happen in production
      throwOnCallFailures: false,
      throwOnTransactionFailures: false
    },

    dev: {
      url: "http://localhost:8545",
      accounts: [deployerAccount, devChainRichAccount, ...generateRandomAccounts(numAccounts - 2)]
    },

    mainnet: {
      url: process.env.RPC_ENDPOINT || "http://localhost:8545",
      accounts: [deployerAccount]
    },

    testnet: {
      url: process.env.RPC_ENDPOINT || "http://localhost:8545",
      accounts: [deployerAccount]
    },

    forkedMainnet: {
      url: "http://localhost:8545"
    }
  },

  paths: {
    artifacts,
    // sources: `${contractsDir}/contracts`,
    cache
  }
};

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    deployProtocol: (
      deployer: Signer,
      useRealPriceFeed?: boolean,
      wrappedNativeTokenAddress?: string,
      overrides?: Overrides
    ) => Promise<_ProtocolDeploymentJSON>;
  }
}

const getLiveArtifact = (name: string): { abi: JsonFragment[]; bytecode: string } =>
  require(`./live/${name}.json`);

const getContractFactory: (
  env: HardhatRuntimeEnvironment
) => (name: string, signer: Signer) => Promise<ContractFactory> = useLiveVersion
  ? env => (name, signer) => {
      const { abi, bytecode } = getLiveArtifact(name);
      return env.ethers.getContractFactory(abi, bytecode, signer);
    }
  : env => env.ethers.getContractFactory;

extendEnvironment(env => {
  env.deployProtocol = async (
    deployer,
    useRealPriceFeed = false,
    wrappedNativeTokenAddress = undefined,
    overrides?: Overrides
  ) => {
    const deployment = await deployAndSetupContracts(
      deployer,
      getContractFactory(env),
      !useRealPriceFeed,
      env.network.name,
      wrappedNativeTokenAddress,
      overrides
    );

    return { ...deployment, version: contractsVersion };
  };
});

type StorageSlotParams = {
  contractAddress: string;
  walletAddress: string;
  slotIndex: number;
  value: string;
};

task("setStorageSlotIndex", "Returns the index of the balanceOf storage slot in an ERC20")
  .addParam("contractAddress", "Address of the contract")
  .addParam("walletAddress", "Address of the wallet balance to set")
  .addOptionalParam("slotIndex", "Index of slot to set")
  .addOptionalParam("value", "Value of slot to set (assumed to be a number)")
  .setAction(
    async (
      {
        contractAddress,
        walletAddress,
        slotIndex = 0,
        value = "1000000000000000000000"
      }: StorageSlotParams,
      hre
    ) => {
      const utils = hre.ethers.utils;
      const erc20 = await hre.ethers.getContractAt("ERC20", contractAddress);
      const balanceBefore = await erc20.balanceOf(walletAddress);
      await hre.ethers.provider.send("hardhat_setStorageAt", [
        contractAddress,
        utils.hexStripZeros(
          utils.keccak256(
            utils.defaultAbiCoder.encode(["address", "uint"], [walletAddress, slotIndex])
          )
        ),
        hre.ethers.utils.hexlify(hre.ethers.utils.zeroPad(hre.ethers.BigNumber.from(value)._hex, 32))
      ]);
      const balanceNow = await erc20.balanceOf(walletAddress);
      console.log({ balanceBefore: balanceBefore.toString(), balanceNow: balanceNow.toString() });
    }
  );

export default config;
