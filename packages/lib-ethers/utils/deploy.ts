import { Signer } from "@ethersproject/abstract-signer";
import { ContractFactory } from "@ethersproject/contracts";
import { Wallet } from "@ethersproject/wallet";
import "dotenv/config";
import fs from "fs-extra";
import path from "path";

import { Decimal } from "@secured-finance/stablecoin-lib-base";

import {
  _ProtocolContract,
  _ProtocolContractAddresses,
  _ProtocolContracts,
  _ProtocolDeploymentJSON,
  _connectToContracts
} from "../src/contracts";

import { getContractAddress } from "ethers/lib/utils";
import mockAggregatorAbi from "../abi/MockAggregator.json";
import { MockAggregator } from "../types";
import { createUniswapV2Pair } from "./UniswapV2Factory";

let silent = true;

export const log = (...constructorArgs: unknown[]): void => {
  if (!silent) {
    console.log(...constructorArgs);
  }
};

export const setSilent = (s: boolean): void => {
  silent = s;
};

const useDeployedContractsEnv = (process.env.USE_DEPLOYED_CONTRACTS ?? "false").toLowerCase();
const useDeployedContracts = !["false", "no", "0"].includes(useDeployedContractsEnv);
const gasCompensation = Decimal.from(10)
  .pow(18)
  .mul(process.env.LIQUIDATION_RESERVE ?? 20)
  .toString();
const minNetDebt = Decimal.from(10)
  .pow(18)
  .mul(process.env.MINIMUM_NET_DEBT ?? 180)
  .toString();
const bootstrapPeriod = 14 * 24 * 60 * 60;

const moduleDir = require
  .resolve("@secured-finance/stablecoin-contracts/package.json")
  .replace("/package.json", "");
const deploymentsDir = path.join(moduleDir, "deployments", "outputs");

const deployContractAndGetBlockNumber = async (
  isProxy: boolean,
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  networkName: string,
  contractName: string,
  deploymentKey: string,
  constructorArgs: unknown[],
  initializationArgs: unknown[] = []
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

    const factory = await getContractFactory(contractName, deployer);

    const { upgrades } = await import("hardhat");

    // const contract = await factory.deploy(...constructorArgs);
    const contract = isProxy
      ? await upgrades.deployProxy(factory, initializationArgs, {
          unsafeAllow: ["constructor", "state-variable-immutable"],
          constructorArgs,
          redeployImplementation: "always"
        })
      : await factory.deploy(...constructorArgs);

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

type DeployContractParams = [
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  networkName: string,
  contractName: string,
  deploymentKey: string,
  constructorArgs: unknown[],
  initializationArgs?: unknown[]
];

const deployContract: (...p: DeployContractParams) => Promise<string> = (...p) =>
  deployContractAndGetBlockNumber(false, ...p).then(([a]) => a);

const deployProxyContract: (...p: DeployContractParams) => Promise<string> = (...p) =>
  deployContractAndGetBlockNumber(true, ...p).then(([a]) => a);

const proxyContractList = [
  "activePool",
  "troveManager",
  "stabilityPool",
  "borrowerOperations",
  "collSurplusPool",
  "communityIssuance",
  "defaultPool",
  "hintHelpers",
  "lockupContractFactory",
  "protocolTokenStaking",
  "priceFeed",
  "sortedTroves",
  "gasPool",
  "unipool",
  "debtToken",
  "protocolToken"
];

const deployContracts = async (
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  networkName: string,
  priceFeedIsTestnet = true
): Promise<[addresses: Omit<_ProtocolContractAddresses, "uniToken">, startBlock: number]> => {
  const mockContractAddresses = await deployMockContracts(deployer, getContractFactory, networkName);

  const addressList = await computeContractAddresses(proxyContractList.length * 2 + 1, deployer);

  // skip nonces for ProxyAdmin
  addressList.shift();

  const cpContracts = proxyContractList.reduce((acc, contract) => {
    addressList.shift(); // skip implementation contract
    acc[contract] = addressList.shift();
    return acc;
  }, {} as Record<string, string | undefined>);

  const [activePoolAddress, startBlock] = await deployContractAndGetBlockNumber(
    true,
    deployer,
    getContractFactory,
    networkName,
    "ActivePool",
    "activePool",
    [],
    [
      cpContracts.borrowerOperations,
      cpContracts.troveManager,
      cpContracts.stabilityPool,
      cpContracts.defaultPool
    ]
  );

  const addresses = {
    activePool: activePoolAddress,
    troveManager: await deployProxyContract(
      deployer,
      getContractFactory,
      networkName,
      "TroveManager",
      "troveManager",
      [gasCompensation, minNetDebt, bootstrapPeriod],
      [
        cpContracts.borrowerOperations,
        cpContracts.activePool,
        cpContracts.defaultPool,
        cpContracts.stabilityPool,
        cpContracts.gasPool,
        cpContracts.collSurplusPool,
        cpContracts.priceFeed,
        cpContracts.debtToken,
        cpContracts.sortedTroves,
        cpContracts.protocolTokenStaking
      ]
    ),
    stabilityPool: await deployProxyContract(
      deployer,
      getContractFactory,
      networkName,
      "StabilityPool",
      "stabilityPool",
      [gasCompensation, minNetDebt],
      [
        cpContracts.borrowerOperations,
        cpContracts.troveManager,
        cpContracts.activePool,
        cpContracts.debtToken,
        cpContracts.sortedTroves,
        cpContracts.priceFeed,
        cpContracts.communityIssuance
      ]
    ),
    borrowerOperations: await deployProxyContract(
      deployer,
      getContractFactory,
      networkName,
      "BorrowerOperations",
      "borrowerOperations",
      [gasCompensation, minNetDebt],
      [
        cpContracts.troveManager,
        cpContracts.activePool,
        cpContracts.defaultPool,
        cpContracts.stabilityPool,
        cpContracts.gasPool,
        cpContracts.collSurplusPool,
        cpContracts.priceFeed,
        cpContracts.sortedTroves,
        cpContracts.debtToken,
        cpContracts.protocolTokenStaking
      ]
    ),
    collSurplusPool: await deployProxyContract(
      deployer,
      getContractFactory,
      networkName,
      "CollSurplusPool",
      "collSurplusPool",
      [],
      [cpContracts.borrowerOperations, cpContracts.troveManager, cpContracts.activePool]
    ),
    communityIssuance: await deployProxyContract(
      deployer,
      getContractFactory,
      networkName,
      "CommunityIssuance",
      "communityIssuance",
      [],
      [cpContracts.protocolToken, cpContracts.stabilityPool]
    ),
    defaultPool: await deployProxyContract(
      deployer,
      getContractFactory,
      networkName,
      "DefaultPool",
      "defaultPool",
      [],
      [cpContracts.troveManager, cpContracts.activePool]
    ),
    hintHelpers: await deployProxyContract(
      deployer,
      getContractFactory,
      networkName,
      "HintHelpers",
      "hintHelpers",
      [gasCompensation, minNetDebt],
      [cpContracts.sortedTroves, cpContracts.troveManager]
    ),
    lockupContractFactory: await deployProxyContract(
      deployer,
      getContractFactory,
      networkName,
      "LockupContractFactory",
      "lockupContractFactory",
      [],
      [cpContracts.protocolToken]
    ),
    protocolTokenStaking: await deployProxyContract(
      deployer,
      getContractFactory,
      networkName,
      "ProtocolTokenStaking",
      "protocolTokenStaking",
      [],
      [
        cpContracts.protocolToken,
        cpContracts.debtToken,
        cpContracts.troveManager,
        cpContracts.borrowerOperations,
        cpContracts.activePool
      ]
    ),
    priceFeed: await deployProxyContract(
      deployer,
      getContractFactory,
      networkName,
      priceFeedIsTestnet ? "MockPriceFeed" : "PriceFeed",
      "priceFeed",
      [24 * 60 * 60],
      [mockContractAddresses.mockAggregator, mockContractAddresses.mockTellor]
    ),
    sortedTroves: await deployProxyContract(
      deployer,
      getContractFactory,
      networkName,
      "SortedTroves",
      "sortedTroves",
      [],
      [1e6, cpContracts.troveManager, cpContracts.borrowerOperations]
    ),
    gasPool: await deployProxyContract(
      deployer,
      getContractFactory,
      networkName,
      "GasPool",
      "gasPool",
      []
    ),
    unipool: await deployProxyContract(
      deployer,
      getContractFactory,
      networkName,
      "Unipool",
      "unipool",
      []
    )
  };

  return [
    {
      ...addresses,
      debtToken: await deployProxyContract(
        deployer,
        getContractFactory,
        networkName,
        "DebtToken",
        "debtToken",
        [],
        [cpContracts.troveManager, cpContracts.stabilityPool, cpContracts.borrowerOperations]
      ),

      protocolToken: await deployProxyContract(
        deployer,
        getContractFactory,
        networkName,
        "ProtocolToken",
        "protocolToken",
        [],
        [cpContracts.protocolTokenStaking, await deployer.getAddress(), "1000"]
      ),

      multiTroveGetter: await deployContract(
        deployer,
        getContractFactory,
        networkName,
        "MultiTroveGetter",
        "multiTroveGetter",
        [cpContracts.troveManager, cpContracts.sortedTroves]
      )
    },

    startBlock
  ];
};

const deployMockContracts = async (
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  networkName: string
): Promise<{ mockAggregator: string; mockTellor: string }> => {
  const mockAggregator = await deployContract(
    deployer,
    getContractFactory,
    networkName,
    "MockAggregator",
    "mockAggregator",
    []
  );
  const mockTellor = await deployContract(
    deployer,
    getContractFactory,
    networkName,
    "MockTellor",
    "mockTellor",
    []
  );

  const mockAggregatorContract = new _ProtocolContract(
    mockAggregator,
    mockAggregatorAbi,
    deployer
  ) as MockAggregator;

  await Promise.all(
    [
      mockAggregatorContract.setPrice(Decimal.from(10).pow(18).mul(200).toString()),
      mockAggregatorContract.setDecimals(18),
      mockAggregatorContract.setLatestRoundId(1),
      mockAggregatorContract.setUseBlockTimestamp(true)
    ].map(async tx => (await tx).wait())
  );

  return { mockAggregator, mockTellor };
};

const connectUniswapPoolContract = async (
  { protocolToken, unipool, uniToken }: _ProtocolContracts,
  deployer: Signer
) => {
  if (!deployer.provider) {
    throw new Error("Signer must have a provider.");
  }

  await unipool.setParams(protocolToken.address, uniToken.address, 2 * 30 * 24 * 60 * 60);
};

const deployMockUniToken = (
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  networkName: string
) =>
  deployProxyContract(deployer, getContractFactory, networkName, "ERC20Mock", "", [
    "Mock Uniswap V2",
    "UNI-V2",
    Wallet.createRandom().address, // initialAccount
    0 // initialBalance
  ]);

export const deployAndSetupContracts = async (
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  _priceFeedIsTestnet = true,
  networkName: string,
  wethAddress?: string
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

    ...(await deployContracts(deployer, getContractFactory, networkName, _priceFeedIsTestnet).then(
      async ([addresses, startBlock]) => ({
        startBlock,

        addresses: {
          ...addresses,

          uniToken: await (wethAddress
            ? createUniswapV2Pair(deployer, wethAddress, addresses.debtToken)
            : deployMockUniToken(deployer, getContractFactory, networkName))
        }
      })
    ))
  };

  const contracts = _connectToContracts(deployer, deployment);

  if (!useDeployedContracts) {
    await (
      await contracts.protocolToken.triggerInitialAllocation(
        [contracts.communityIssuance.address, contracts.unipool.address],
        ["10000000000000000000000000", "1300000000000000000000000"]
      )
    ).wait();

    const protocolTokenTotalSupply = await contracts.protocolToken.totalSupply();

    if (protocolTokenTotalSupply.gt(0)) {
      log("Connecting only Unipool contract...");
      await connectUniswapPoolContract(contracts, deployer);
    }
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

const computeContractAddresses = async (count: number, deployerWallet: Signer) => {
  const transactionCount = await deployerWallet.getTransactionCount();
  const contractAddresses = [];

  for (let i = 0; i < count; i++) {
    const contractAddress = getContractAddress({
      from: await deployerWallet.getAddress(),
      nonce: transactionCount + i
    });
    contractAddresses.push(contractAddress);
  }

  return contractAddresses;
};
