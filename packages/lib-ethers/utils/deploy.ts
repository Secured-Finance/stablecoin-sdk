import { Signer } from "@ethersproject/abstract-signer";
import { ContractFactory, Overrides } from "@ethersproject/contracts";
import { Wallet } from "@ethersproject/wallet";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";

import { Decimal } from "@secured-finance/stablecoin-lib-base";

import {
  _ProtocolContractAddresses,
  _ProtocolContracts,
  _ProtocolDeploymentJSON,
  _connectToContracts
} from "../src/contracts";

import { createUniswapV2Pair } from "./UniswapV2Factory";

let silent = true;

export const log = (...args: unknown[]): void => {
  if (!silent) {
    console.log(...args);
  }
};

export const setSilent = (s: boolean): void => {
  silent = s;
};

dotenv.config();

const useDeployedContractsEnv = (process.env.USE_DEPLOYED_CONTRACTS ?? "false").toLowerCase();
const useDeployedContracts = !["false", "no", "0"].includes(useDeployedContractsEnv);
const gasCompensation = Decimal.from(10)
  .pow(18)
  .mul(process.env.GAS_COMPENSATION ?? 20)
  .toString();
const minNetDebt = Decimal.from(10)
  .pow(18)
  .mul(process.env.MIN_NET_DEBT ?? 180)
  .toString();

const deploymentsDir = path.join("..", "contracts", "deployments", "outputs");

const deployContractAndGetBlockNumber = async (
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  networkName: string,
  contractName: string,
  deploymentKey: string,
  ...args: unknown[]
): Promise<[address: string, blockNumber: number]> => {
  let contractAddress: string;
  let blockNumber: number;

  if (useDeployedContracts && !!deploymentKey) {
    log(`Fetching ${contractName} ...`);
    const fileContent = fs.readFileSync(`${deploymentsDir}/${networkName}.json`, "utf-8");
    const deployments = JSON.parse(fileContent);
    contractAddress = deployments[deploymentKey].address;
    // const tx = await deployer.provider?.getTransaction(deployments[deploymentKey].txHash);

    // if (!tx?.blockNumber) {
    //   throw new Error("Invalid block number.");
    // }

    // blockNumber = tx?.blockNumber;

    blockNumber = 0;

    log({
      contractAddress,
      blockNumber
    });
  } else {
    log(`Deploying ${contractName} ...`);
    const contract = await (await getContractFactory(contractName, deployer)).deploy(...args);

    log(`Waiting for transaction ${contract.deployTransaction.hash} ...`);
    const receipt = await contract.deployTransaction.wait();

    log({
      contractAddress: contract.address,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toNumber()
    });

    contractAddress = contract.address;
    blockNumber = receipt.blockNumber;
  }

  log();

  // return [contract.address, receipt.blockNumber];
  return [contractAddress, blockNumber];
};

const deployContract: (
  ...p: Parameters<typeof deployContractAndGetBlockNumber>
) => Promise<string> = (...p) => deployContractAndGetBlockNumber(...p).then(([a]) => a);

const deployContracts = async (
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  networkName: string,
  priceFeedIsTestnet = true,
  overrides?: Overrides
): Promise<[addresses: Omit<_ProtocolContractAddresses, "uniToken">, startBlock: number]> => {
  const [activePoolAddress, startBlock] = await deployContractAndGetBlockNumber(
    deployer,
    getContractFactory,
    networkName,
    "ActivePool",
    "activePool",
    { ...overrides }
  );

  const addresses = {
    activePool: activePoolAddress,
    borrowerOperations: await deployContract(
      deployer,
      getContractFactory,
      networkName,
      "BorrowerOperations",
      "borrowerOperations",
      gasCompensation,
      minNetDebt,
      {
        ...overrides
      }
    ),
    troveManager: await deployContract(
      deployer,
      getContractFactory,
      networkName,
      "TroveManager",
      "troveManager",
      gasCompensation,
      minNetDebt,
      {
        ...overrides
      }
    ),
    collSurplusPool: await deployContract(
      deployer,
      getContractFactory,
      networkName,
      "CollSurplusPool",
      "collSurplusPool",
      {
        ...overrides
      }
    ),
    communityIssuance: await deployContract(
      deployer,
      getContractFactory,
      networkName,
      "CommunityIssuance",
      "communityIssuance",
      {
        ...overrides
      }
    ),
    defaultPool: await deployContract(
      deployer,
      getContractFactory,
      networkName,
      "DefaultPool",
      "defaultPool",
      {
        ...overrides
      }
    ),
    hintHelpers: await deployContract(
      deployer,
      getContractFactory,
      networkName,
      "HintHelpers",
      "hintHelpers",
      gasCompensation,
      minNetDebt,
      {
        ...overrides
      }
    ),
    lockupContractFactory: await deployContract(
      deployer,
      getContractFactory,
      networkName,
      "LockupContractFactory",
      "lockupContractFactory",
      { ...overrides }
    ),
    protocolTokenStaking: await deployContract(
      deployer,
      getContractFactory,
      networkName,
      "ProtocolTokenStaking",
      "protocolTokenStaking",
      {
        ...overrides
      }
    ),
    priceFeed: await deployContract(
      deployer,
      getContractFactory,
      networkName,
      priceFeedIsTestnet ? "MockPriceFeed" : "PriceFeed",
      "priceFeed",
      { ...overrides }
    ),
    sortedTroves: await deployContract(
      deployer,
      getContractFactory,
      networkName,
      "SortedTroves",
      "sortedTroves",
      {
        ...overrides
      }
    ),
    stabilityPool: await deployContract(
      deployer,
      getContractFactory,
      networkName,
      "StabilityPool",
      "stabilityPool",
      gasCompensation,
      minNetDebt,
      {
        ...overrides
      }
    ),
    gasPool: await deployContract(deployer, getContractFactory, networkName, "GasPool", "gasPool", {
      ...overrides
    }),
    unipool: await deployContract(deployer, getContractFactory, networkName, "Unipool", "unipool", {
      ...overrides
    })
  };

  return [
    {
      ...addresses,
      debtToken: await deployContract(
        deployer,
        getContractFactory,
        networkName,
        "DebtToken",
        "debtToken",
        addresses.troveManager,
        addresses.stabilityPool,
        addresses.borrowerOperations,
        { ...overrides }
      ),

      protocolToken: await deployContract(
        deployer,
        getContractFactory,
        networkName,
        "ProtocolToken",
        "protocolToken",
        addresses.communityIssuance,
        addresses.protocolTokenStaking,
        addresses.lockupContractFactory,
        Wallet.createRandom().address, // _bountyAddress (TODO: parameterize this)
        addresses.unipool, // _lpRewardsAddress
        Wallet.createRandom().address, // _multisigAddress (TODO: parameterize this)
        { ...overrides }
      ),

      multiTroveGetter: await deployContract(
        deployer,
        getContractFactory,
        networkName,
        "MultiTroveGetter",
        "multiTroveGetter",
        addresses.troveManager,
        addresses.sortedTroves,
        { ...overrides }
      )
    },

    startBlock
  ];
};

export const deployTellorCaller = (
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  tellorAddress: string,
  overrides?: Overrides
): Promise<string> =>
  deployContract(deployer, getContractFactory, "TellorCaller", "tellorCaller", tellorAddress, {
    ...overrides
  });

export const deployPythCaller = (
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  pythPriceFeedAddress: string,
  pythPriceId: string,
  overrides?: Overrides
): Promise<string> =>
  deployContract(
    deployer,
    getContractFactory,
    "PythCaller",
    "pythCaller",
    pythPriceFeedAddress,
    pythPriceId,
    {
      ...overrides
    }
  );

const connectUniswapPoolContract = async (
  { protocolToken, unipool, uniToken }: _ProtocolContracts,
  deployer: Signer,
  overrides?: Overrides
) => {
  if (!deployer.provider) {
    throw new Error("Signer must have a provider.");
  }

  await unipool.setParams(protocolToken.address, uniToken.address, 2 * 30 * 24 * 60 * 60, overrides);
};

const deployMockUniToken = (
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  networkName: string,
  overrides?: Overrides
) =>
  deployContract(
    deployer,
    getContractFactory,
    networkName,
    "ERC20Mock",
    "",
    "Mock Uniswap V2",
    "UNI-V2",
    Wallet.createRandom().address, // initialAccount
    0, // initialBalance
    { ...overrides }
  );

export const deployAndSetupContracts = async (
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  _priceFeedIsTestnet = true,
  networkName: string,
  wethAddress?: string,
  overrides?: Overrides
): Promise<_ProtocolDeploymentJSON> => {
  if (!deployer.provider) {
    throw new Error("Signer must have a provider.");
  }

  log("Deploying contracts...");
  log();

  const deployment: _ProtocolDeploymentJSON = {
    chainId: await deployer.getChainId(),
    version: "unknown",
    deploymentDate: new Date().getTime(),
    bootstrapPeriod: 0,
    totalStabilityPoolProtocolTokenReward: "0",
    liquidityMiningProtocolTokenRewardRate: "0",
    _priceFeedIsTestnet,
    _uniTokenIsMock: !wethAddress,
    _isDev: networkName === "dev",

    ...(await deployContracts(
      deployer,
      getContractFactory,
      networkName,
      _priceFeedIsTestnet,
      overrides
    ).then(async ([addresses, startBlock]) => ({
      startBlock,

      addresses: {
        ...addresses,

        uniToken: await (wethAddress
          ? createUniswapV2Pair(deployer, wethAddress, addresses.debtToken, overrides)
          : deployMockUniToken(deployer, getContractFactory, networkName, overrides))
      }
    })))
  };

  const contracts = _connectToContracts(deployer, deployment);

  const protocolTokenTotalSupply = await contracts.protocolToken.totalSupply();

  if (useDeployedContracts && protocolTokenTotalSupply.gt(0)) {
    log("Connecting only Unipool contract...");
    await connectUniswapPoolContract(contracts, deployer, overrides);
  }

  const deploymentStartTime = await contracts.troveManager.deploymentStartTime();
  const bootstrapPeriod = await contracts.troveManager.BOOTSTRAP_PERIOD();
  const totalStabilityPoolProtocolTokenReward =
    await contracts.communityIssuance.protocolTokenSupplyCap();
  const liquidityMiningProtocolTokenRewardRate = await contracts.unipool.rewardRate();

  return {
    ...deployment,
    deploymentDate: deploymentStartTime.toNumber() * 1000,
    bootstrapPeriod: bootstrapPeriod.toNumber(),
    totalStabilityPoolProtocolTokenReward: `${Decimal.fromBigNumberString(
      totalStabilityPoolProtocolTokenReward.toHexString()
    )}`,
    liquidityMiningProtocolTokenRewardRate: `${Decimal.fromBigNumberString(
      liquidityMiningProtocolTokenRewardRate.toHexString()
    )}`
  };
};
