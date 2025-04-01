import { Block, BlockTag } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";

import { Decimal } from "@secured-finance/stablecoin-lib-base";

import devOrNull from "../deployments/dev.json";
import mainnet from "../deployments/mainnet.json";
import testnet from "../deployments/testnet.json";

import { numberify, panic } from "./_utils";
import { EthersProvider, EthersSigner } from "./types";

import {
  _connectToContracts,
  _ProtocolContractAddresses,
  _ProtocolContracts,
  _ProtocolDeploymentJSON
} from "./contracts";

import { _connectToMulticall, _Multicall } from "./_Multicall";

const dev = devOrNull as _ProtocolDeploymentJSON | null;

const deployments: {
  [chainId: number]: _ProtocolDeploymentJSON | undefined;
} = {
  [mainnet.chainId]: mainnet,
  [testnet.chainId]: testnet,

  ...(dev !== null ? { [dev.chainId]: dev } : {})
};

declare const brand: unique symbol;

const branded = <T>(t: Omit<T, typeof brand>): T => t as T;

/**
 * Information about a connection to the protocol.
 *
 * @remarks
 * Provided for debugging / informational purposes.
 *
 * Exposed through {@link ReadableEthers.connection} and {@link EthersSfStablecoin.connection}.
 *
 * @public
 */
export interface EthersConnection extends EthersConnectionOptionalParams {
  /** Ethers `Provider` used for connecting to the network. */
  readonly provider: EthersProvider;

  /** Ethers `Signer` used for sending transactions. */
  readonly signer?: EthersSigner;

  /** Chain ID of the connected network. */
  readonly chainId: number;

  /** Version of the contracts (Git commit hash). */
  readonly version: string;

  /** Date when the contracts were deployed. */
  readonly deploymentDate: Date;

  /** Number of block in which the first contract was deployed. */
  readonly startBlock: number;

  /** Time period (in seconds) after `deploymentDate` during which redemptions are disabled. */
  readonly bootstrapPeriod: number;

  /** Total amount of ProtocolToken allocated for rewarding stability depositors. */
  readonly totalStabilityPoolProtocolTokenReward: Decimal;

  /** Amount of ProtocolToken collectively rewarded to stakers of the liquidity mining pool per second. */
  readonly liquidityMiningProtocolTokenRewardRate: Decimal;

  /** A mapping of contracts' names to their addresses. */
  readonly addresses: Record<string, string>;

  /** @internal */
  readonly _priceFeedIsTestnet: boolean;

  /** @internal */
  readonly _isDev: boolean;

  /** @internal */
  readonly [brand]: unique symbol;
}

/** @internal */
export interface _InternalEthersConnection extends EthersConnection {
  readonly addresses: _ProtocolContractAddresses;
  readonly _contracts: _ProtocolContracts;
  readonly _multicall?: _Multicall;
}

const connectionFrom = (
  provider: EthersProvider,
  signer: EthersSigner | undefined,
  _contracts: _ProtocolContracts,
  _multicall: _Multicall | undefined,
  {
    deploymentDate,
    totalStabilityPoolProtocolTokenReward,
    liquidityMiningProtocolTokenRewardRate,
    ...deployment
  }: _ProtocolDeploymentJSON,
  optionalParams?: EthersConnectionOptionalParams
): _InternalEthersConnection => {
  if (
    optionalParams &&
    optionalParams.useStore !== undefined &&
    !validStoreOptions.includes(optionalParams.useStore)
  ) {
    throw new Error(`Invalid useStore value ${optionalParams.useStore}`);
  }

  return branded({
    provider,
    signer,
    _contracts,
    _multicall,
    deploymentDate: new Date(deploymentDate),
    totalStabilityPoolProtocolTokenReward: Decimal.from(totalStabilityPoolProtocolTokenReward),
    liquidityMiningProtocolTokenRewardRate: Decimal.from(liquidityMiningProtocolTokenRewardRate),
    ...deployment,
    ...optionalParams
  });
};

/** @internal */
export const _getContracts = (connection: EthersConnection): _ProtocolContracts =>
  (connection as _InternalEthersConnection)._contracts;

const getMulticall = (connection: EthersConnection): _Multicall | undefined =>
  (connection as _InternalEthersConnection)._multicall;

const getTimestampFromBlock = ({ timestamp }: Block) => timestamp;

/** @internal */
export const _getBlockTimestamp = (
  connection: EthersConnection,
  blockTag: BlockTag = "latest"
): Promise<number> =>
  // Get the timestamp via a contract call whenever possible, to make it batchable with other calls
  getMulticall(connection)?.getCurrentBlockTimestamp({ blockTag }).then(numberify) ??
  _getProvider(connection).getBlock(blockTag).then(getTimestampFromBlock);

/** @internal */
export const _requireSigner = (connection: EthersConnection): EthersSigner =>
  connection.signer ?? panic(new Error("Must be connected through a Signer"));

/** @internal */
export const _getProvider = (connection: EthersConnection): EthersProvider => connection.provider;

// TODO parameterize error message?
/** @internal */
export const _requireAddress = (
  connection: EthersConnection,
  overrides?: { from?: string }
): string =>
  overrides?.from ?? connection.userAddress ?? panic(new Error("A user address is required"));

/** @internal */
export const _requireFrontendAddress = (connection: EthersConnection): string =>
  connection.frontendTag ?? panic(new Error("A frontend address is required"));

/** @internal */
export const _usingStore = (
  connection: EthersConnection
): connection is EthersConnection & { useStore: EthersSfStablecoinStoreOption } =>
  connection.useStore !== undefined;

/**
 * Thrown when trying to connect to a network where the protocol is not deployed.
 *
 * @remarks
 * Thrown by {@link ReadableEthers.(connect:2)} and {@link EthersSfStablecoin.(connect:2)}.
 *
 * @public
 */
export class UnsupportedNetworkError extends Error {
  /** Chain ID of the unsupported network. */
  readonly chainId: number;

  /** @internal */
  constructor(chainId: number) {
    super(`Unsupported network (chainId = ${chainId})`);
    this.name = "UnsupportedNetworkError";
    this.chainId = chainId;
  }
}

const getProviderAndSigner = (
  signerOrProvider: EthersSigner | EthersProvider
): [provider: EthersProvider, signer: EthersSigner | undefined] => {
  const provider: EthersProvider = Signer.isSigner(signerOrProvider)
    ? signerOrProvider.provider ?? panic(new Error("Signer must have a Provider"))
    : signerOrProvider;

  const signer = Signer.isSigner(signerOrProvider) ? signerOrProvider : undefined;

  return [provider, signer];
};

/** @internal */
export const _connectToDeployment = (
  deployment: _ProtocolDeploymentJSON,
  signerOrProvider: EthersSigner | EthersProvider,
  optionalParams?: EthersConnectionOptionalParams
): EthersConnection =>
  connectionFrom(
    ...getProviderAndSigner(signerOrProvider),
    _connectToContracts(signerOrProvider, deployment),
    undefined,
    deployment,
    optionalParams
  );

/**
 * Possible values for the optional
 * {@link EthersConnectionOptionalParams.useStore | useStore}
 * connection parameter.
 *
 * @remarks
 * Currently, the only supported value is `"blockPolled"`, in which case a
 * {@link BlockPolledSfStablecoinStore} will be created.
 *
 * @public
 */
export type EthersSfStablecoinStoreOption = "blockPolled";

const validStoreOptions = ["blockPolled"];

/**
 * Optional parameters of {@link ReadableEthers.(connect:2)} and
 * {@link EthersSfStablecoin.(connect:2)}.
 *
 * @public
 */
export interface EthersConnectionOptionalParams {
  /**
   * Address whose Trove, Stability Deposit, ProtocolToken Stake and balances will be read by default.
   *
   * @remarks
   * For example {@link EthersSfStablecoin.getTrove | getTrove(address?)} will return the Trove owned by
   * `userAddress` when the `address` parameter is omitted.
   *
   * Should be omitted when connecting through a {@link EthersSigner | Signer}. Instead `userAddress`
   * will be automatically determined from the `Signer`.
   */
  readonly userAddress?: string;

  /**
   * Address that will receive ProtocolToken rewards from newly created Stability Deposits by default.
   *
   * @remarks
   * For example
   * {@link EthersSfStablecoin.depositDebtTokenInStabilityPool | depositDebtTokenInStabilityPool(amount, frontendTag?)}
   * will tag newly made Stability Deposits with this address when its `frontendTag` parameter is
   * omitted.
   */
  readonly frontendTag?: string;

  /**
   * Create a {@link @secured-finance/stablecoin-lib-base#SfStablecoinStore} and expose it as the `store` property.
   *
   * @remarks
   * When set to one of the available {@link EthersSfStablecoinStoreOption | options},
   * {@link ReadableEthers.(connect:2) | ReadableEthers.connect()} will return a
   * {@link ReadableEthersWithStore}, while
   * {@link EthersSfStablecoin.(connect:2) | EthersSfStablecoin.connect()} will return an
   * {@link EthersSfStablecoinWithStore}.
   *
   * Note that the store won't start monitoring the blockchain until its
   * {@link @secured-finance/stablecoin-lib-base#SfStablecoinStore.start | start()} function is called.
   */
  readonly useStore?: EthersSfStablecoinStoreOption;
}

/** @internal */
export function _connectByChainId<T>(
  provider: EthersProvider,
  signer: EthersSigner | undefined,
  chainId: number,
  optionalParams: EthersConnectionOptionalParams & { useStore: T }
): EthersConnection & { useStore: T };

/** @internal */
export function _connectByChainId(
  provider: EthersProvider,
  signer: EthersSigner | undefined,
  chainId: number,
  optionalParams?: EthersConnectionOptionalParams
): EthersConnection;

/** @internal */
export function _connectByChainId(
  provider: EthersProvider,
  signer: EthersSigner | undefined,
  chainId: number,
  optionalParams?: EthersConnectionOptionalParams
): EthersConnection {
  const deployment: _ProtocolDeploymentJSON =
    deployments[chainId] ?? panic(new UnsupportedNetworkError(chainId));

  return connectionFrom(
    provider,
    signer,
    _connectToContracts(provider, deployment),
    _connectToMulticall(provider, chainId),
    deployment,
    optionalParams
  );
}

/** @internal */
export const _connect = async (
  signerOrProvider: EthersSigner | EthersProvider,
  optionalParams?: EthersConnectionOptionalParams
): Promise<EthersConnection> => {
  const [provider, signer] = getProviderAndSigner(signerOrProvider);

  if (signer) {
    if (optionalParams?.userAddress !== undefined) {
      throw new Error("Can't override userAddress when connecting through Signer");
    }

    optionalParams = {
      ...optionalParams,
      userAddress: await signer.getAddress()
    };
  }

  return _connectByChainId(provider, signer, (await provider.getNetwork()).chainId, optionalParams);
};
