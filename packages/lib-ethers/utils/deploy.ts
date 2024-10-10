import { Signer } from "@ethersproject/abstract-signer";
import { ContractFactory, ContractTransaction, Overrides } from "@ethersproject/contracts";
import { Wallet } from "@ethersproject/wallet";
import dotenv from "dotenv";
import fs from "fs-extra";

import { Decimal } from "@secured-finance/lib-base";

import {
  _LiquityContractAddresses,
  _LiquityContracts,
  _LiquityDeploymentJSON,
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

const deploymentsDir = require
  .resolve("@secured-finance/stablecoin-contracts/package.json")
  .replace("/package.json", "/mainnetDeployment");

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
    const fileContent = fs.readFileSync(
      `${deploymentsDir}/${networkName}DeploymentOutput.json`,
      "utf-8"
    );
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
): Promise<[addresses: Omit<_LiquityContractAddresses, "uniToken">, startBlock: number]> => {
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
    lqtyStaking: await deployContract(
      deployer,
      getContractFactory,
      networkName,
      "LQTYStaking",
      "lqtyStaking",
      {
        ...overrides
      }
    ),
    priceFeed: await deployContract(
      deployer,
      getContractFactory,
      networkName,
      priceFeedIsTestnet ? "PriceFeedTestnet" : "PriceFeed",
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

      lqtyToken: await deployContract(
        deployer,
        getContractFactory,
        networkName,
        "LQTYToken",
        "lqtyToken",
        addresses.communityIssuance,
        addresses.lqtyStaking,
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

const connectContracts = async (
  {
    activePool,
    borrowerOperations,
    troveManager,
    debtToken,
    collSurplusPool,
    communityIssuance,
    defaultPool,
    lqtyToken,
    hintHelpers,
    lockupContractFactory,
    lqtyStaking,
    priceFeed,
    sortedTroves,
    stabilityPool,
    gasPool,
    unipool,
    uniToken
  }: _LiquityContracts,
  deployer: Signer,
  overrides?: Overrides
) => {
  if (!deployer.provider) {
    throw new Error("Signer must have a provider.");
  }

  const txCount = await deployer.provider.getTransactionCount(deployer.getAddress());

  const connections: ((nonce: number) => Promise<ContractTransaction | undefined>)[] = [
    nonce =>
      sortedTroves.setParams(1e6, troveManager.address, borrowerOperations.address, {
        ...overrides,
        nonce
      }),

    nonce =>
      troveManager.setAddresses(
        borrowerOperations.address,
        activePool.address,
        defaultPool.address,
        stabilityPool.address,
        gasPool.address,
        collSurplusPool.address,
        priceFeed.address,
        debtToken.address,
        sortedTroves.address,
        lqtyToken.address,
        lqtyStaking.address,
        { ...overrides, nonce }
      ),

    nonce =>
      borrowerOperations.setAddresses(
        troveManager.address,
        activePool.address,
        defaultPool.address,
        stabilityPool.address,
        gasPool.address,
        collSurplusPool.address,
        priceFeed.address,
        sortedTroves.address,
        debtToken.address,
        lqtyStaking.address,
        { ...overrides, nonce }
      ),

    nonce =>
      stabilityPool.setAddresses(
        borrowerOperations.address,
        troveManager.address,
        activePool.address,
        debtToken.address,
        sortedTroves.address,
        priceFeed.address,
        communityIssuance.address,
        { ...overrides, nonce }
      ),

    nonce =>
      activePool.setAddresses(
        borrowerOperations.address,
        troveManager.address,
        stabilityPool.address,
        defaultPool.address,
        { ...overrides, nonce }
      ),

    nonce =>
      defaultPool.setAddresses(troveManager.address, activePool.address, {
        ...overrides,
        nonce
      }),

    nonce =>
      collSurplusPool.setAddresses(
        borrowerOperations.address,
        troveManager.address,
        activePool.address,
        { ...overrides, nonce }
      ),

    nonce =>
      hintHelpers.setAddresses(sortedTroves.address, troveManager.address, {
        ...overrides,
        nonce
      }),

    nonce =>
      lqtyStaking.setAddresses(
        lqtyToken.address,
        debtToken.address,
        troveManager.address,
        borrowerOperations.address,
        activePool.address,
        { ...overrides, nonce }
      ),

    nonce =>
      lockupContractFactory.setLQTYTokenAddress(lqtyToken.address, {
        ...overrides,
        nonce
      }),

    nonce =>
      communityIssuance.setAddresses(lqtyToken.address, stabilityPool.address, {
        ...overrides,
        nonce
      }),

    nonce =>
      unipool.setParams(lqtyToken.address, uniToken.address, 2 * 30 * 24 * 60 * 60, {
        ...overrides,
        nonce
      })
  ];

  const txs = await Promise.all(connections.map((connect, i) => connect(txCount + i)));

  let i = 0;
  await Promise.all(txs.map(tx => tx?.wait().then(() => log(`Connected ${++i}`))));
};

const connectUniswapPoolContract = async (
  { lqtyToken, unipool, uniToken }: _LiquityContracts,
  deployer: Signer,
  overrides?: Overrides
) => {
  if (!deployer.provider) {
    throw new Error("Signer must have a provider.");
  }

  const txCount = await deployer.provider.getTransactionCount(deployer.getAddress());

  await unipool.setParams(lqtyToken.address, uniToken.address, 2 * 30 * 24 * 60 * 60, {
    ...overrides,
    nonce: txCount
  });
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
): Promise<_LiquityDeploymentJSON> => {
  if (!deployer.provider) {
    throw new Error("Signer must have a provider.");
  }

  log("Deploying contracts...");
  log();

  const deployment: _LiquityDeploymentJSON = {
    chainId: await deployer.getChainId(),
    version: "unknown",
    deploymentDate: new Date().getTime(),
    bootstrapPeriod: 0,
    totalStabilityPoolLQTYReward: "0",
    liquidityMiningLQTYRewardRate: "0",
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

  if (!useDeployedContracts) {
    log("Connecting contracts...");
    await connectContracts(contracts, deployer, overrides);
  } else {
    log("Connecting only Unipool contract...");
    await connectUniswapPoolContract(contracts, deployer, overrides);
  }

  const lqtyTokenDeploymentTime = await contracts.lqtyToken.getDeploymentStartTime();
  const bootstrapPeriod = await contracts.troveManager.BOOTSTRAP_PERIOD();
  const totalStabilityPoolLQTYReward = await contracts.communityIssuance.LQTYSupplyCap();
  const liquidityMiningLQTYRewardRate = await contracts.unipool.rewardRate();

  return {
    ...deployment,
    deploymentDate: lqtyTokenDeploymentTime.toNumber() * 1000,
    bootstrapPeriod: bootstrapPeriod.toNumber(),
    totalStabilityPoolLQTYReward: `${Decimal.fromBigNumberString(
      totalStabilityPoolLQTYReward.toHexString()
    )}`,
    liquidityMiningLQTYRewardRate: `${Decimal.fromBigNumberString(
      liquidityMiningLQTYRewardRate.toHexString()
    )}`
  };
};
