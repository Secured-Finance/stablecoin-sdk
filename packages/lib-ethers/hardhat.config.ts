import "colors";
import "dotenv/config";
import fs from "fs";
import path from "path";

import { JsonFragment } from "@ethersproject/abi";
import { Signer } from "@ethersproject/abstract-signer";
import { ContractFactory, Overrides } from "@ethersproject/contracts";
import { Wallet } from "@ethersproject/wallet";

import "@nomiclabs/hardhat-ethers";
import { extendEnvironment, HardhatUserConfig, task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Decimal } from "@secured-finance/stablecoin-lib-base";

import { _ProtocolDeploymentJSON } from "./src/contracts";
import { deployAndSetupContracts, setSilent } from "./utils/deploy";

import accounts from "./accounts.json";

const numAccounts = 100;

const useLiveVersionEnv = (process.env.USE_LIVE_VERSION ?? "false").toLowerCase();
const useLiveVersion = !["false", "no", "0"].includes(useLiveVersionEnv);

const artifacts = path.join("./", "artifacts");

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

const wrappedNativeTokenAddresses = {
  mainnet: "0x60E1773636CF5E4A227d9AC24F20fEca034ee25A",
  testnet: "0xaC26a4Ab9cF2A8c5DBaB6fb4351ec0F4b07356c4"
};

const hasWrappedNativeToken = (
  network: string
): network is keyof typeof wrappedNativeTokenAddresses => network in wrappedNativeTokenAddresses;

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

type DeployParams = {
  channel: string;
  gasPrice?: number;
  useRealPriceFeed?: boolean;
  createUniswapPair?: boolean;
};

const defaultChannel = process.env.CHANNEL || "default";

task("deploy", "Deploys the contracts to the network")
  .addOptionalParam("channel", "Deployment channel to deploy into", defaultChannel, types.string)
  .addOptionalParam("gasPrice", "Price to pay for 1 gas [Gwei]", undefined, types.float)
  .addOptionalParam(
    "useRealPriceFeed",
    "Deploy the production version of PriceFeed and connect it to Chainlink",
    undefined,
    types.boolean
  )
  .addOptionalParam(
    "createUniswapPair",
    "Create a real Uniswap v2 WFIL-DebtToken pair instead of a mock ERC20 token",
    undefined,
    types.boolean
  )
  .setAction(
    async ({ channel, gasPrice, useRealPriceFeed, createUniswapPair }: DeployParams, env) => {
      const overrides = { gasPrice: gasPrice && Decimal.from(gasPrice).div(1000000000).hex };
      const [deployer] = await env.ethers.getSigners();

      useRealPriceFeed ??= env.network.name === "mainnet";

      let wrappedNativeTokenAddress: string | undefined = undefined;
      if (createUniswapPair) {
        if (!hasWrappedNativeToken(env.network.name)) {
          throw new Error(`Wrapped native token not deployed on ${env.network.name}`);
        }
        wrappedNativeTokenAddress = wrappedNativeTokenAddresses[env.network.name];
      }

      setSilent(false);

      const deployment = await env.deployProtocol(
        deployer,
        useRealPriceFeed,
        wrappedNativeTokenAddress,
        overrides
      );

      fs.mkdirSync(path.join("deployments", channel), { recursive: true });

      fs.writeFileSync(
        path.join("deployments", channel, `${env.network.name}.json`),
        JSON.stringify(deployment, undefined, 2)
      );

      console.log();
      console.log(deployment);
      console.log();
    }
  );

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
