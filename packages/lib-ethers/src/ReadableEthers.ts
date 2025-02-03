import assert from "assert";

import { BlockTag } from "@ethersproject/abstract-provider";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { AddressZero } from "@ethersproject/constants";

import {
  Decimal,
  Fees,
  FrontendStatus,
  ProtocolTokenStake,
  ReadableProtocol,
  SfStablecoinStore,
  StabilityDeposit,
  Trove,
  TroveListingParams,
  TroveWithPendingRedistribution,
  UserTrove,
  UserTroveStatus
} from "@secured-finance/stablecoin-lib-base";

import { MultiTroveGetter } from "../types";

import { decimalify, numberify, panic } from "./_utils";
import { EthersCallOverrides, EthersProvider, EthersSigner } from "./types";

import {
  _connect,
  _getBlockTimestamp,
  _getContracts,
  _requireAddress,
  _requireFrontendAddress,
  EthersConnection,
  EthersConnectionOptionalParams,
  EthersSfStablecoinStoreOption
} from "./EthersConnection";

import { BlockPolledSfStablecoinStore } from "./BlockPolledSfStablecoinStore";

// With 70 iterations redemption costs about ~10M gas, and each iteration accounts for ~138k more
/** @internal */
export const redeemMaxIterations = 70;

// TODO: these are constant in the contracts, so it doesn't make sense to make a call for them,
// but to avoid having to update them here when we change them in the contracts, we could read
// them once after deployment and save them to Deployment.
const MINUTE_DECAY_FACTOR = Decimal.from("0.999037758833783000");
const BETA = Decimal.from(2);

enum BackendTroveStatus {
  nonExistent,
  active,
  closedByOwner,
  closedByLiquidation,
  closedByRedemption
}

const userTroveStatusFrom = (backendStatus: BackendTroveStatus): UserTroveStatus =>
  backendStatus === BackendTroveStatus.nonExistent
    ? "nonExistent"
    : backendStatus === BackendTroveStatus.active
    ? "open"
    : backendStatus === BackendTroveStatus.closedByOwner
    ? "closedByOwner"
    : backendStatus === BackendTroveStatus.closedByLiquidation
    ? "closedByLiquidation"
    : backendStatus === BackendTroveStatus.closedByRedemption
    ? "closedByRedemption"
    : panic(new Error(`invalid backendStatus ${backendStatus}`));

const convertToDate = (timestamp: number) => new Date(timestamp * 1000);

const validSortingOptions = ["ascendingCollateralRatio", "descendingCollateralRatio"];

const expectPositiveInt = <K extends string>(obj: { [P in K]?: number }, key: K) => {
  if (obj[key] !== undefined) {
    if (!Number.isInteger(obj[key])) {
      throw new Error(`${key} must be an integer`);
    }

    if (obj[key] < 0) {
      throw new Error(`${key} must not be negative`);
    }
  }
};

// To get the best entropy available, we'd do something like:
//
// const bigRandomNumber = () =>
//   BigNumber.from(
//     `0x${Array.from(crypto.getRandomValues(new Uint32Array(8)))
//       .map(u32 => u32.toString(16).padStart(8, "0"))
//       .join("")}`
//   );
//
// However, Window.crypto is browser-specific. Since we only use this for randomly picking Troves
// during the search for hints, Math.random() will do fine, too.
//
// This returns a random integer between 0 and Number.MAX_SAFE_INTEGER
const randomInteger = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

// Maximum number of trials to perform in a single getApproxHint() call. If the number of trials
// required to get a statistically "good" hint is larger than this, the search for the hint will
// be broken up into multiple getApproxHint() calls.
//
// This should be low enough to work with popular public Ethereum providers like Infura without
// triggering any fair use limits.
const maxNumberOfTrialsAtOnce = 2500;

function* generateTrials(totalNumberOfTrials: number) {
  assert(Number.isInteger(totalNumberOfTrials) && totalNumberOfTrials > 0);

  while (totalNumberOfTrials) {
    const numberOfTrials = Math.min(totalNumberOfTrials, maxNumberOfTrialsAtOnce);
    yield numberOfTrials;

    totalNumberOfTrials -= numberOfTrials;
  }
}

/**
 * Ethers-based implementation of {@link @secured-finance/stablecoin-lib-base#ReadableProtocol}.
 *
 * @public
 */
export class ReadableEthers implements ReadableProtocol {
  readonly connection: EthersConnection;

  /** @internal */
  constructor(connection: EthersConnection) {
    this.connection = connection;
  }

  /** @internal */
  static _from(
    connection: EthersConnection & { useStore: "blockPolled" }
  ): ReadableEthersWithStore<BlockPolledSfStablecoinStore>;

  /** @internal */
  static _from(connection: EthersConnection): ReadableEthers;

  /** @internal */
  static _from(connection: EthersConnection): ReadableEthers {
    const readable = new ReadableEthers(connection);

    return connection.useStore === "blockPolled"
      ? new _BlockPolledReadableEthers(readable)
      : readable;
  }

  /** @internal */
  static connect(
    signerOrProvider: EthersSigner | EthersProvider,
    optionalParams: EthersConnectionOptionalParams & { useStore: "blockPolled" }
  ): Promise<ReadableEthersWithStore<BlockPolledSfStablecoinStore>>;

  static connect(
    signerOrProvider: EthersSigner | EthersProvider,
    optionalParams?: EthersConnectionOptionalParams
  ): Promise<ReadableEthers>;

  /**
   * Connect to the protocol and create a `ReadableEthers` object.
   *
   * @param signerOrProvider - Ethers `Signer` or `Provider` to use for connecting to the Ethereum
   *                           network.
   * @param optionalParams - Optional parameters that can be used to customize the connection.
   */
  static async connect(
    signerOrProvider: EthersSigner | EthersProvider,
    optionalParams?: EthersConnectionOptionalParams
  ): Promise<ReadableEthers> {
    return ReadableEthers._from(await _connect(signerOrProvider, optionalParams));
  }

  /**
   * Check whether this `ReadableEthers` is a {@link ReadableEthersWithStore}.
   */
  hasStore(): this is ReadableEthersWithStore;

  /**
   * Check whether this `ReadableEthers` is a
   * {@link ReadableEthersWithStore}\<{@link BlockPolledSfStablecoinStore}\>.
   */
  hasStore(store: "blockPolled"): this is ReadableEthersWithStore<BlockPolledSfStablecoinStore>;

  hasStore(): boolean {
    return false;
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getTotalRedistributed} */
  async getTotalRedistributed(overrides?: EthersCallOverrides): Promise<Trove> {
    const { troveManager } = _getContracts(this.connection);

    const [collateral, debt] = await Promise.all([
      troveManager.L_FIL({ ...overrides }).then(decimalify),
      troveManager.L_Debt({ ...overrides }).then(decimalify)
    ]);

    return new Trove(collateral, debt);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getTroveBeforeRedistribution} */
  async getTroveBeforeRedistribution(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<TroveWithPendingRedistribution> {
    address ??= _requireAddress(this.connection);
    const { troveManager } = _getContracts(this.connection);

    const [trove, snapshot] = await Promise.all([
      troveManager.Troves(address, { ...overrides }),
      troveManager.rewardSnapshots(address, { ...overrides })
    ]);

    if (trove.status === BackendTroveStatus.active) {
      return new TroveWithPendingRedistribution(
        address,
        userTroveStatusFrom(trove.status),
        decimalify(trove.coll),
        decimalify(trove.debt),
        decimalify(trove.stake),
        new Trove(decimalify(snapshot.FIL), decimalify(snapshot.debt))
      );
    } else {
      return new TroveWithPendingRedistribution(address, userTroveStatusFrom(trove.status));
    }
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getTrove} */
  async getTrove(address?: string, overrides?: EthersCallOverrides): Promise<UserTrove> {
    const [trove, totalRedistributed] = await Promise.all([
      this.getTroveBeforeRedistribution(address, overrides),
      this.getTotalRedistributed(overrides)
    ]);

    return trove.applyRedistribution(totalRedistributed);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getNumberOfTroves} */
  async getNumberOfTroves(overrides?: EthersCallOverrides): Promise<number> {
    const { troveManager } = _getContracts(this.connection);

    return (await troveManager.getTroveOwnersCount({ ...overrides })).toNumber();
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getPrice} */
  getPrice(overrides?: EthersCallOverrides): Promise<Decimal> {
    const { priceFeed } = _getContracts(this.connection);

    return priceFeed.callStatic.fetchPrice({ ...overrides }).then(decimalify);
  }

  /** @internal */
  async _getActivePool(overrides?: EthersCallOverrides): Promise<Trove> {
    const { activePool } = _getContracts(this.connection);

    const [activeCollateral, activeDebt] = await Promise.all(
      [activePool.getFIL({ ...overrides }), activePool.getDebt({ ...overrides })].map(getBigNumber =>
        getBigNumber.then(decimalify)
      )
    );

    return new Trove(activeCollateral, activeDebt);
  }

  /** @internal */
  async _getDefaultPool(overrides?: EthersCallOverrides): Promise<Trove> {
    const { defaultPool } = _getContracts(this.connection);

    const [liquidatedCollateral, closedDebt] = await Promise.all(
      [defaultPool.getFIL({ ...overrides }), defaultPool.getDebt({ ...overrides })].map(
        getBigNumber => getBigNumber.then(decimalify)
      )
    );

    return new Trove(liquidatedCollateral, closedDebt);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getTotal} */
  async getTotal(overrides?: EthersCallOverrides): Promise<Trove> {
    const [activePool, defaultPool] = await Promise.all([
      this._getActivePool(overrides),
      this._getDefaultPool(overrides)
    ]);

    return activePool.add(defaultPool);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getStabilityDeposit} */
  async getStabilityDeposit(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<StabilityDeposit> {
    address ??= _requireAddress(this.connection);
    const { stabilityPool } = _getContracts(this.connection);

    const [{ frontEndTag, initialValue }, currentDebtToken, collateralGain, protocolTokenReward] =
      await Promise.all([
        stabilityPool.deposits(address, { ...overrides }),
        stabilityPool.getCompoundedDebtTokenDeposit(address, { ...overrides }),
        stabilityPool.getDepositorFILGain(address, { ...overrides }),
        stabilityPool.getDepositorProtocolTokenGain(address, { ...overrides })
      ]);

    return new StabilityDeposit(
      decimalify(initialValue),
      decimalify(currentDebtToken),
      decimalify(collateralGain),
      decimalify(protocolTokenReward),
      frontEndTag
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getRemainingStabilityPoolProtocolTokenReward} */
  async getRemainingStabilityPoolProtocolTokenReward(
    overrides?: EthersCallOverrides
  ): Promise<Decimal> {
    const { communityIssuance } = _getContracts(this.connection);

    const issuanceCap = this.connection.totalStabilityPoolProtocolTokenReward;
    const totalProtocolTokenIssued = decimalify(
      await communityIssuance.totalProtocolTokenIssued({ ...overrides })
    );

    // totalProtocolTokenIssued approaches but never reaches issuanceCap
    return issuanceCap.sub(totalProtocolTokenIssued);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getDebtTokenInStabilityPool} */
  getDebtTokenInStabilityPool(overrides?: EthersCallOverrides): Promise<Decimal> {
    const { stabilityPool } = _getContracts(this.connection);

    return stabilityPool.getTotalDebtTokenDeposits({ ...overrides }).then(decimalify);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getDebtTokenBalance} */
  getDebtTokenBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    address ??= _requireAddress(this.connection);
    const { debtToken } = _getContracts(this.connection);

    return debtToken.balanceOf(address, { ...overrides }).then(decimalify);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getProtocolTokenBalance} */
  getProtocolTokenBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    address ??= _requireAddress(this.connection);
    const { protocolToken } = _getContracts(this.connection);

    return protocolToken.balanceOf(address, { ...overrides }).then(decimalify);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getUniTokenBalance} */
  getUniTokenBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    address ??= _requireAddress(this.connection);
    const { uniToken } = _getContracts(this.connection);

    return uniToken.balanceOf(address, { ...overrides }).then(decimalify);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getUniTokenAllowance} */
  getUniTokenAllowance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    address ??= _requireAddress(this.connection);
    const { uniToken, unipool } = _getContracts(this.connection);

    return uniToken.allowance(address, unipool.address, { ...overrides }).then(decimalify);
  }

  /** @internal */
  async _getRemainingProtocolMiningProtocolTokenRewardCalculator(
    overrides?: EthersCallOverrides
  ): Promise<(blockTimestamp: number) => Decimal> {
    const { unipool } = _getContracts(this.connection);

    const [totalSupply, rewardRate, periodFinish, lastUpdateTime] = await Promise.all([
      unipool.totalSupply({ ...overrides }),
      unipool.rewardRate({ ...overrides }).then(decimalify),
      unipool.periodFinish({ ...overrides }).then(numberify),
      unipool.lastUpdateTime({ ...overrides }).then(numberify)
    ]);

    return (blockTimestamp: number) =>
      rewardRate.mul(
        Math.max(0, periodFinish - (totalSupply.isZero() ? lastUpdateTime : blockTimestamp))
      );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getRemainingProtocolMiningProtocolTokenReward} */
  async getRemainingProtocolMiningProtocolTokenReward(
    overrides?: EthersCallOverrides
  ): Promise<Decimal> {
    const [calculateRemainingProtocolToken, blockTimestamp] = await Promise.all([
      this._getRemainingProtocolMiningProtocolTokenRewardCalculator(overrides),
      this._getBlockTimestamp(overrides?.blockTag)
    ]);

    return calculateRemainingProtocolToken(blockTimestamp);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getLiquidityMiningStake} */
  getLiquidityMiningStake(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    address ??= _requireAddress(this.connection);
    const { unipool } = _getContracts(this.connection);

    return unipool.balanceOf(address, { ...overrides }).then(decimalify);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getTotalStakedUniTokens} */
  getTotalStakedUniTokens(overrides?: EthersCallOverrides): Promise<Decimal> {
    const { unipool } = _getContracts(this.connection);

    return unipool.totalSupply({ ...overrides }).then(decimalify);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getLiquidityMiningProtocolTokenReward} */
  getLiquidityMiningProtocolTokenReward(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<Decimal> {
    address ??= _requireAddress(this.connection);
    const { unipool } = _getContracts(this.connection);

    return unipool.earned(address, { ...overrides }).then(decimalify);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getCollateralSurplusBalance} */
  getCollateralSurplusBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    address ??= _requireAddress(this.connection);
    const { collSurplusPool } = _getContracts(this.connection);

    return collSurplusPool.getCollateral(address, { ...overrides }).then(decimalify);
  }

  /** @internal */
  getTroves(
    params: TroveListingParams & { beforeRedistribution: true },
    overrides?: EthersCallOverrides
  ): Promise<TroveWithPendingRedistribution[]>;

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.(getTroves:2)} */
  getTroves(params: TroveListingParams, overrides?: EthersCallOverrides): Promise<UserTrove[]>;

  async getTroves(
    params: TroveListingParams,
    overrides?: EthersCallOverrides
  ): Promise<UserTrove[]> {
    const { multiTroveGetter } = _getContracts(this.connection);

    expectPositiveInt(params, "first");
    expectPositiveInt(params, "startingAt");

    if (!validSortingOptions.includes(params.sortedBy)) {
      throw new Error(
        `sortedBy must be one of: ${validSortingOptions.map(x => `"${x}"`).join(", ")}`
      );
    }

    const [totalRedistributed, backendTroves] = await Promise.all([
      params.beforeRedistribution ? undefined : this.getTotalRedistributed({ ...overrides }),
      multiTroveGetter.getMultipleSortedTroves(
        params.sortedBy === "descendingCollateralRatio"
          ? params.startingAt ?? 0
          : -((params.startingAt ?? 0) + 1),
        params.first,
        { ...overrides }
      )
    ]);

    const troves = mapBackendTroves(backendTroves);

    if (totalRedistributed) {
      return troves.map(trove => trove.applyRedistribution(totalRedistributed));
    } else {
      return troves;
    }
  }

  /** @internal */
  _getBlockTimestamp(blockTag?: BlockTag): Promise<number> {
    return _getBlockTimestamp(this.connection, blockTag);
  }

  /** @internal */
  async _getFeesFactory(
    overrides?: EthersCallOverrides
  ): Promise<(blockTimestamp: number, recoveryMode: boolean) => Fees> {
    const { troveManager } = _getContracts(this.connection);

    const [lastFeeOperationTime, baseRateWithoutDecay] = await Promise.all([
      troveManager.lastFeeOperationTime({ ...overrides }),
      troveManager.baseRate({ ...overrides }).then(decimalify)
    ]);

    return (blockTimestamp, recoveryMode) =>
      new Fees(
        baseRateWithoutDecay,
        MINUTE_DECAY_FACTOR,
        BETA,
        convertToDate(lastFeeOperationTime.toNumber()),
        convertToDate(blockTimestamp),
        recoveryMode
      );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getFees} */
  async getFees(overrides?: EthersCallOverrides): Promise<Fees> {
    const [createFees, total, price, blockTimestamp] = await Promise.all([
      this._getFeesFactory(overrides),
      this.getTotal(overrides),
      this.getPrice(overrides),
      this._getBlockTimestamp(overrides?.blockTag)
    ]);

    return createFees(blockTimestamp, total.collateralRatioIsBelowCritical(price));
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getProtocolTokenStake} */
  async getProtocolTokenStake(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<ProtocolTokenStake> {
    address ??= _requireAddress(this.connection);
    const { protocolTokenStaking } = _getContracts(this.connection);

    const [stakedProtocolToken, collateralGain, debtTokenGain] = await Promise.all(
      [
        protocolTokenStaking.stakes(address, { ...overrides }),
        protocolTokenStaking.getPendingFILGain(address, { ...overrides }),
        protocolTokenStaking.getPendingDebtTokenGain(address, { ...overrides })
      ].map(getBigNumber => getBigNumber.then(decimalify))
    );

    return new ProtocolTokenStake(stakedProtocolToken, collateralGain, debtTokenGain);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getTotalStakedProtocolToken} */
  async getTotalStakedProtocolToken(overrides?: EthersCallOverrides): Promise<Decimal> {
    const { protocolTokenStaking } = _getContracts(this.connection);

    return protocolTokenStaking.totalProtocolTokenStaked({ ...overrides }).then(decimalify);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#ReadableProtocol.getFrontendStatus} */
  async getFrontendStatus(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<FrontendStatus> {
    address ??= _requireFrontendAddress(this.connection);
    const { stabilityPool } = _getContracts(this.connection);

    const { registered, kickbackRate } = await stabilityPool.frontEnds(address, { ...overrides });

    return registered
      ? { status: "registered", kickbackRate: decimalify(kickbackRate) }
      : { status: "unregistered" };
  }

  async findHintsForNominalCollateralRatio(
    nominalCollateralRatio: Decimal,
    ownAddress?: string,
    overrides?: EthersCallOverrides
  ): Promise<[string, string]> {
    const { sortedTroves, hintHelpers } = _getContracts(this.connection);
    const numberOfTroves = await this.getNumberOfTroves();

    if (!numberOfTroves) {
      return [AddressZero, AddressZero];
    }

    if (nominalCollateralRatio.infinite) {
      return [AddressZero, await sortedTroves.getFirst()];
    }

    const totalNumberOfTrials = Math.ceil(10 * Math.sqrt(numberOfTroves));
    const [firstTrials, ...restOfTrials] = generateTrials(totalNumberOfTrials);

    const collectApproxHint = (
      {
        latestRandomSeed,
        results
      }: {
        latestRandomSeed: BigNumberish;
        results: { diff: BigNumber; hintAddress: string }[];
      },
      numberOfTrials: number
    ) =>
      hintHelpers
        .getApproxHint(nominalCollateralRatio.hex, numberOfTrials, latestRandomSeed, {
          ...overrides
        })
        .then(({ latestRandomSeed, ...result }) => ({
          latestRandomSeed,
          results: [...results, result]
        }));

    const { results } = await restOfTrials.reduce(
      (p, numberOfTrials) => p.then(state => collectApproxHint(state, numberOfTrials)),
      collectApproxHint({ latestRandomSeed: randomInteger(), results: [] }, firstTrials)
    );

    const { hintAddress } = results.reduce((a, b) => (a.diff.lt(b.diff) ? a : b));

    let [prev, next] = await sortedTroves.findInsertPosition(
      nominalCollateralRatio.hex,
      hintAddress,
      hintAddress,
      { ...overrides }
    );

    if (ownAddress) {
      // In the case of reinsertion, the address of the Trove being reinserted is not a usable hint,
      // because it is deleted from the list before the reinsertion.
      // "Jump over" the Trove to get the proper hint.
      if (prev === ownAddress) {
        prev = await sortedTroves.getPrev(prev);
      } else if (next === ownAddress) {
        next = await sortedTroves.getNext(next);
      }
    }

    // Don't use `address(0)` as hint as it can result in huge gas cost.
    // (See https://github.com/liquity/dev/issues/600).
    if (prev === AddressZero) {
      prev = next;
    } else if (next === AddressZero) {
      next = prev;
    }

    return [prev, next];
  }

  async findRedemptionHints(
    amount: Decimal,
    overrides?: EthersCallOverrides
  ): Promise<
    [
      truncatedAmount: Decimal,
      firstRedemptionHint: string,
      partialRedemptionUpperHint: string,
      partialRedemptionLowerHint: string,
      partialRedemptionHintNICR: BigNumber
    ]
  > {
    const { hintHelpers } = _getContracts(this.connection);
    const price = await this.getPrice();

    const { firstRedemptionHint, partialRedemptionHintNICR, truncatedDebtTokenAmount } =
      await hintHelpers.getRedemptionHints(amount.hex, price.hex, redeemMaxIterations, {
        ...overrides
      });

    const [partialRedemptionUpperHint, partialRedemptionLowerHint] =
      partialRedemptionHintNICR.isZero()
        ? [AddressZero, AddressZero]
        : await this.findHintsForNominalCollateralRatio(
            decimalify(partialRedemptionHintNICR),
            undefined, // XXX: if we knew the partially redeemed Trove's address, we'd pass it here
            overrides
          );

    return [
      decimalify(truncatedDebtTokenAmount),
      firstRedemptionHint,
      partialRedemptionUpperHint,
      partialRedemptionLowerHint,
      partialRedemptionHintNICR
    ];
  }
}

type Resolved<T> = T extends Promise<infer U> ? U : T;
type BackendTroves = Resolved<ReturnType<MultiTroveGetter["getMultipleSortedTroves"]>>;

const mapBackendTroves = (troves: BackendTroves): TroveWithPendingRedistribution[] =>
  troves.map(
    trove =>
      new TroveWithPendingRedistribution(
        trove.owner,
        "open", // These Troves are coming from the SortedTroves list, so they must be open
        decimalify(trove.coll),
        decimalify(trove.debt),
        decimalify(trove.stake),
        new Trove(decimalify(trove.snapshotFIL), decimalify(trove.snapshotDebt))
      )
  );

/**
 * Variant of {@link ReadableEthers} that exposes a {@link @secured-finance/stablecoin-lib-base#SfStablecoinStore}.
 *
 * @public
 */
export interface ReadableEthersWithStore<T extends SfStablecoinStore = SfStablecoinStore>
  extends ReadableEthers {
  /** An object that implements SfStablecoinStore. */
  readonly store: T;
}

class _BlockPolledReadableEthers implements ReadableEthersWithStore<BlockPolledSfStablecoinStore> {
  readonly connection: EthersConnection;
  readonly store: BlockPolledSfStablecoinStore;

  private readonly _readable: ReadableEthers;

  constructor(readable: ReadableEthers) {
    const store = new BlockPolledSfStablecoinStore(readable);

    this.store = store;
    this.connection = readable.connection;
    this._readable = readable;
  }

  private _blockHit(overrides?: EthersCallOverrides): boolean {
    return (
      !overrides ||
      overrides.blockTag === undefined ||
      overrides.blockTag === this.store.state.blockTag
    );
  }

  private _userHit(address?: string, overrides?: EthersCallOverrides): boolean {
    return (
      this._blockHit(overrides) &&
      (address === undefined || address === this.store.connection.userAddress)
    );
  }

  private _frontendHit(address?: string, overrides?: EthersCallOverrides): boolean {
    return (
      this._blockHit(overrides) &&
      (address === undefined || address === this.store.connection.frontendTag)
    );
  }

  hasStore(store?: EthersSfStablecoinStoreOption): boolean {
    return store === undefined || store === "blockPolled";
  }

  async getTotalRedistributed(overrides?: EthersCallOverrides): Promise<Trove> {
    return this._blockHit(overrides)
      ? this.store.state.totalRedistributed
      : this._readable.getTotalRedistributed(overrides);
  }

  async getTroveBeforeRedistribution(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<TroveWithPendingRedistribution> {
    return this._userHit(address, overrides)
      ? this.store.state.troveBeforeRedistribution
      : this._readable.getTroveBeforeRedistribution(address, overrides);
  }

  async getTrove(address?: string, overrides?: EthersCallOverrides): Promise<UserTrove> {
    return this._userHit(address, overrides)
      ? this.store.state.trove
      : this._readable.getTrove(address, overrides);
  }

  async getNumberOfTroves(overrides?: EthersCallOverrides): Promise<number> {
    return this._blockHit(overrides)
      ? this.store.state.numberOfTroves
      : this._readable.getNumberOfTroves(overrides);
  }

  async getPrice(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._blockHit(overrides) ? this.store.state.price : this.getPrice(overrides);
  }

  async getTotal(overrides?: EthersCallOverrides): Promise<Trove> {
    return this._blockHit(overrides) ? this.store.state.total : this._readable.getTotal(overrides);
  }

  async getStabilityDeposit(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<StabilityDeposit> {
    return this._userHit(address, overrides)
      ? this.store.state.stabilityDeposit
      : this._readable.getStabilityDeposit(address, overrides);
  }

  async getRemainingStabilityPoolProtocolTokenReward(
    overrides?: EthersCallOverrides
  ): Promise<Decimal> {
    return this._blockHit(overrides)
      ? this.store.state.remainingStabilityPoolProtocolTokenReward
      : this._readable.getRemainingStabilityPoolProtocolTokenReward(overrides);
  }

  async getDebtTokenInStabilityPool(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._blockHit(overrides)
      ? this.store.state.debtTokenInStabilityPool
      : this._readable.getDebtTokenInStabilityPool(overrides);
  }

  async getDebtTokenBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._userHit(address, overrides)
      ? this.store.state.debtTokenBalance
      : this._readable.getDebtTokenBalance(address, overrides);
  }

  async getProtocolTokenBalance(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<Decimal> {
    return this._userHit(address, overrides)
      ? this.store.state.protocolTokenBalance
      : this._readable.getProtocolTokenBalance(address, overrides);
  }

  async getUniTokenBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._userHit(address, overrides)
      ? this.store.state.uniTokenBalance
      : this._readable.getUniTokenBalance(address, overrides);
  }

  async getUniTokenAllowance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._userHit(address, overrides)
      ? this.store.state.uniTokenAllowance
      : this._readable.getUniTokenAllowance(address, overrides);
  }

  async getRemainingProtocolMiningProtocolTokenReward(
    overrides?: EthersCallOverrides
  ): Promise<Decimal> {
    return this._blockHit(overrides)
      ? this.store.state.remainingProtocolMiningProtocolTokenReward
      : this._readable.getRemainingProtocolMiningProtocolTokenReward(overrides);
  }

  async getLiquidityMiningStake(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<Decimal> {
    return this._userHit(address, overrides)
      ? this.store.state.liquidityMiningStake
      : this._readable.getLiquidityMiningStake(address, overrides);
  }

  async getTotalStakedUniTokens(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._blockHit(overrides)
      ? this.store.state.totalStakedUniTokens
      : this._readable.getTotalStakedUniTokens(overrides);
  }

  async getLiquidityMiningProtocolTokenReward(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<Decimal> {
    return this._userHit(address, overrides)
      ? this.store.state.liquidityMiningProtocolTokenReward
      : this._readable.getLiquidityMiningProtocolTokenReward(address, overrides);
  }

  async getCollateralSurplusBalance(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<Decimal> {
    return this._userHit(address, overrides)
      ? this.store.state.collateralSurplusBalance
      : this._readable.getCollateralSurplusBalance(address, overrides);
  }

  async _getBlockTimestamp(blockTag?: BlockTag): Promise<number> {
    return this._blockHit({ blockTag })
      ? this.store.state.blockTimestamp
      : this._readable._getBlockTimestamp(blockTag);
  }

  async _getFeesFactory(
    overrides?: EthersCallOverrides
  ): Promise<(blockTimestamp: number, recoveryMode: boolean) => Fees> {
    return this._blockHit(overrides)
      ? this.store.state._feesFactory
      : this._readable._getFeesFactory(overrides);
  }

  async getFees(overrides?: EthersCallOverrides): Promise<Fees> {
    return this._blockHit(overrides) ? this.store.state.fees : this._readable.getFees(overrides);
  }

  async getProtocolTokenStake(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<ProtocolTokenStake> {
    return this._userHit(address, overrides)
      ? this.store.state.protocolTokenStake
      : this._readable.getProtocolTokenStake(address, overrides);
  }

  async getTotalStakedProtocolToken(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._blockHit(overrides)
      ? this.store.state.totalStakedProtocolToken
      : this._readable.getTotalStakedProtocolToken(overrides);
  }

  async getFrontendStatus(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<FrontendStatus> {
    return this._frontendHit(address, overrides)
      ? this.store.state.frontend
      : this._readable.getFrontendStatus(address, overrides);
  }

  async findHintsForNominalCollateralRatio(
    nominalCollateralRatio: Decimal,
    ownAddress?: string,
    overrides?: EthersCallOverrides
  ): Promise<[string, string]> {
    return this._readable.findHintsForNominalCollateralRatio(
      nominalCollateralRatio,
      ownAddress,
      overrides
    );
  }

  async findRedemptionHints(
    amount: Decimal,
    overrides?: EthersCallOverrides
  ): Promise<
    [
      truncatedAmount: Decimal,
      firstRedemptionHint: string,
      partialRedemptionUpperHint: string,
      partialRedemptionLowerHint: string,
      partialRedemptionHintNICR: BigNumber
    ]
  > {
    return this._readable.findRedemptionHints(amount, overrides);
  }

  getTroves(
    params: TroveListingParams & { beforeRedistribution: true },
    overrides?: EthersCallOverrides
  ): Promise<TroveWithPendingRedistribution[]>;

  getTroves(params: TroveListingParams, overrides?: EthersCallOverrides): Promise<UserTrove[]>;

  getTroves(params: TroveListingParams, overrides?: EthersCallOverrides): Promise<UserTrove[]> {
    return this._readable.getTroves(params, overrides);
  }

  _getActivePool(): Promise<Trove> {
    throw new Error("Method not implemented.");
  }

  _getDefaultPool(): Promise<Trove> {
    throw new Error("Method not implemented.");
  }

  _getRemainingProtocolMiningProtocolTokenRewardCalculator(): Promise<
    (blockTimestamp: number) => Decimal
  > {
    throw new Error("Method not implemented.");
  }
}
