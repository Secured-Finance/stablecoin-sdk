import { Decimalish } from "./Decimal";
import { TroveAdjustmentParams, TroveCreationParams } from "./Trove";

import {
  CollateralGainTransferDetails,
  LiquidationDetails,
  RedemptionDetails,
  StabilityDepositChangeDetails,
  StabilityPoolGainsWithdrawalDetails,
  TransactableProtocol,
  TroveAdjustmentDetails,
  TroveClosureDetails,
  TroveCreationDetails
} from "./TransactableProtocol";

/**
 * A transaction that has already been sent.
 *
 * @remarks
 * Implemented by {@link @secured-finance/stablecoin-lib-ethers#SentEthersTransaction}.
 *
 * @public
 */
export interface SentProtocolTransaction<S = unknown, T extends ProtocolReceipt = ProtocolReceipt> {
  /** Implementation-specific sent transaction object. */
  readonly rawSentTransaction: S;

  /**
   * Check whether the transaction has been mined, and whether it was successful.
   *
   * @remarks
   * Unlike {@link @secured-finance/stablecoin-lib-base#SentProtocolTransaction.waitForReceipt | waitForReceipt()},
   * this function doesn't wait for the transaction to be mined.
   */
  getReceipt(): Promise<T>;

  /**
   * Wait for the transaction to be mined, and check whether it was successful.
   *
   * @returns Either a {@link @secured-finance/stablecoin-lib-base#FailedReceipt} or a
   *          {@link @secured-finance/stablecoin-lib-base#SuccessfulReceipt}.
   */
  waitForReceipt(): Promise<Extract<T, MinedReceipt>>;
}

/**
 * Indicates that the transaction hasn't been mined yet.
 *
 * @remarks
 * Returned by {@link SentProtocolTransaction.getReceipt}.
 *
 * @public
 */
export type PendingReceipt = { status: "pending" };

/** @internal */
export const _pendingReceipt: PendingReceipt = { status: "pending" };

/**
 * Indicates that the transaction has been mined, but it failed.
 *
 * @remarks
 * The `rawReceipt` property is an implementation-specific transaction receipt object.
 *
 * Returned by {@link SentProtocolTransaction.getReceipt} and
 * {@link SentProtocolTransaction.waitForReceipt}.
 *
 * @public
 */
export type FailedReceipt<R = unknown> = { status: "failed"; rawReceipt: R };

/** @internal */
export const _failedReceipt = <R>(rawReceipt: R): FailedReceipt<R> => ({
  status: "failed",
  rawReceipt
});

/**
 * Indicates that the transaction has succeeded.
 *
 * @remarks
 * The `rawReceipt` property is an implementation-specific transaction receipt object.
 *
 * The `details` property may contain more information about the transaction.
 * See the return types of {@link TransactableProtocol} functions for the exact contents of `details`
 * for each type of transaction.
 *
 * Returned by {@link SentProtocolTransaction.getReceipt} and
 * {@link SentProtocolTransaction.waitForReceipt}.
 *
 * @public
 */
export type SuccessfulReceipt<R = unknown, D = unknown> = {
  status: "succeeded";
  rawReceipt: R;
  details: D;
};

/** @internal */
export const _successfulReceipt = <R, D>(
  rawReceipt: R,
  details: D,
  toString?: () => string
): SuccessfulReceipt<R, D> => ({
  status: "succeeded",
  rawReceipt,
  details,
  ...(toString ? { toString } : {})
});

/**
 * Either a {@link FailedReceipt} or a {@link SuccessfulReceipt}.
 *
 * @public
 */
export type MinedReceipt<R = unknown, D = unknown> = FailedReceipt<R> | SuccessfulReceipt<R, D>;

/**
 * One of either a {@link PendingReceipt}, a {@link FailedReceipt} or a {@link SuccessfulReceipt}.
 *
 * @public
 */
export type ProtocolReceipt<R = unknown, D = unknown> = PendingReceipt | MinedReceipt<R, D>;

/** @internal */
export type _SendableFrom<T, R, S> = {
  [M in keyof T]: T[M] extends (...args: infer A) => Promise<infer D>
    ? (...args: A) => Promise<SentProtocolTransaction<S, ProtocolReceipt<R, D>>>
    : never;
};

/**
 * Send transactions.
 *
 * @remarks
 * The functions return an object implementing {@link SentProtocolTransaction}, which can be used
 * to monitor the transaction and get its details when it succeeds.
 *
 * Implemented by {@link @secured-finance/stablecoin-lib-ethers#SendableEthers}.
 *
 * @public
 */
export interface SendableProtocol<R = unknown, S = unknown>
  extends _SendableFrom<TransactableProtocol, R, S> {
  // Methods re-declared for documentation purposes

  /** {@inheritDoc TransactableProtocol.openTrove} */
  openTrove(
    params: TroveCreationParams<Decimalish>,
    maxBorrowingRate?: Decimalish
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, TroveCreationDetails>>>;

  /** {@inheritDoc TransactableProtocol.closeTrove} */
  closeTrove(): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, TroveClosureDetails>>>;

  /** {@inheritDoc TransactableProtocol.adjustTrove} */
  adjustTrove(
    params: TroveAdjustmentParams<Decimalish>,
    maxBorrowingRate?: Decimalish
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, TroveAdjustmentDetails>>>;

  /** {@inheritDoc TransactableProtocol.depositCollateral} */
  depositCollateral(
    amount: Decimalish
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, TroveAdjustmentDetails>>>;

  /** {@inheritDoc TransactableProtocol.withdrawCollateral} */
  withdrawCollateral(
    amount: Decimalish
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, TroveAdjustmentDetails>>>;

  /** {@inheritDoc TransactableProtocol.borrowDebtToken} */
  borrowDebtToken(
    amount: Decimalish,
    maxBorrowingRate?: Decimalish
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, TroveAdjustmentDetails>>>;

  /** {@inheritDoc TransactableProtocol.repayDebtToken} */
  repayDebtToken(
    amount: Decimalish
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, TroveAdjustmentDetails>>>;

  /** @internal */
  setPrice(price: Decimalish): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, void>>>;

  /** {@inheritDoc TransactableProtocol.liquidate} */
  liquidate(
    address: string | string[]
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, LiquidationDetails>>>;

  /** {@inheritDoc TransactableProtocol.liquidateUpTo} */
  liquidateUpTo(
    maximumNumberOfTrovesToLiquidate: number
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, LiquidationDetails>>>;

  /** {@inheritDoc TransactableProtocol.depositDebtTokenInStabilityPool} */
  depositDebtTokenInStabilityPool(
    amount: Decimalish,
    frontendTag?: string
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, StabilityDepositChangeDetails>>>;

  /** {@inheritDoc TransactableProtocol.withdrawDebtTokenFromStabilityPool} */
  withdrawDebtTokenFromStabilityPool(
    amount: Decimalish
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, StabilityDepositChangeDetails>>>;

  /** {@inheritDoc TransactableProtocol.withdrawGainsFromStabilityPool} */
  withdrawGainsFromStabilityPool(): Promise<
    SentProtocolTransaction<S, ProtocolReceipt<R, StabilityPoolGainsWithdrawalDetails>>
  >;

  /** {@inheritDoc TransactableProtocol.transferCollateralGainToTrove} */
  transferCollateralGainToTrove(): Promise<
    SentProtocolTransaction<S, ProtocolReceipt<R, CollateralGainTransferDetails>>
  >;

  /** {@inheritDoc TransactableProtocol.sendDebtToken} */
  sendDebtToken(
    toAddress: string,
    amount: Decimalish
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, void>>>;

  /** {@inheritDoc TransactableProtocol.sendProtocolToken} */
  sendProtocolToken(
    toAddress: string,
    amount: Decimalish
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, void>>>;

  /** {@inheritDoc TransactableProtocol.redeemDebtToken} */
  redeemDebtToken(
    amount: Decimalish,
    maxRedemptionRate?: Decimalish
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, RedemptionDetails>>>;

  /** {@inheritDoc TransactableProtocol.claimCollateralSurplus} */
  claimCollateralSurplus(): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, void>>>;

  /** {@inheritDoc TransactableProtocol.stakeProtocolToken} */
  stakeProtocolToken(
    amount: Decimalish
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, void>>>;

  /** {@inheritDoc TransactableProtocol.unstakeProtocolToken} */
  unstakeProtocolToken(
    amount: Decimalish
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, void>>>;

  /** {@inheritDoc TransactableProtocol.withdrawGainsFromStaking} */
  withdrawGainsFromStaking(): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, void>>>;

  /** {@inheritDoc TransactableProtocol.approveUniTokens} */
  approveUniTokens(
    allowance?: Decimalish
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, void>>>;

  /** {@inheritDoc TransactableProtocol.stakeUniTokens} */
  stakeUniTokens(amount: Decimalish): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, void>>>;

  /** {@inheritDoc TransactableProtocol.unstakeUniTokens} */
  unstakeUniTokens(
    amount: Decimalish
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, void>>>;

  /** {@inheritDoc TransactableProtocol.withdrawProtocolTokenRewardFromProtocolMining} */
  withdrawProtocolTokenRewardFromProtocolMining(): Promise<
    SentProtocolTransaction<S, ProtocolReceipt<R, void>>
  >;

  /** {@inheritDoc TransactableProtocol.exitLiquidityMining} */
  exitLiquidityMining(): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, void>>>;

  /** {@inheritDoc TransactableProtocol.registerFrontend} */
  registerFrontend(
    kickbackRate: Decimalish
  ): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, void>>>;
}
