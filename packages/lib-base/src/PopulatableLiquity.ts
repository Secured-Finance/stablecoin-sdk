import { Decimal, Decimalish } from "./Decimal";
import { LiquityReceipt, SendableLiquity, SentLiquityTransaction } from "./SendableLiquity";
import { TroveAdjustmentParams, TroveCreationParams } from "./Trove";

import {
  CollateralGainTransferDetails,
  LiquidationDetails,
  RedemptionDetails,
  StabilityDepositChangeDetails,
  StabilityPoolGainsWithdrawalDetails,
  TroveAdjustmentDetails,
  TroveClosureDetails,
  TroveCreationDetails
} from "./TransactableLiquity";

/**
 * A transaction that has been prepared for sending.
 *
 * @remarks
 * Implemented by {@link @secured-finance/lib-ethers#PopulatedEthersLiquityTransaction}.
 *
 * @public
 */
export interface PopulatedLiquityTransaction<
  P = unknown,
  T extends SentLiquityTransaction = SentLiquityTransaction
> {
  /** Implementation-specific populated transaction object. */
  readonly rawPopulatedTransaction: P;

  /**
   * Send the transaction.
   *
   * @returns An object that implements {@link @secured-finance/lib-base#SentLiquityTransaction}.
   */
  send(): Promise<T>;
}

/**
 * A redemption transaction that has been prepared for sending.
 *
 * @remarks
 * The Liquity protocol fulfills redemptions by repaying the debt of Troves in ascending order of
 * their collateralization ratio, and taking a portion of their collateral in exchange. Due to the
 * {@link @secured-finance/lib-base#MINIMUM_DEBT | minimum debt} requirement that Troves must fulfill,
 * some DebtToken amounts are not possible to redeem exactly.
 *
 * When {@link @secured-finance/lib-base#PopulatableLiquity.redeemDebtToken | redeemDebtToken()} is called with an
 * amount that can't be fully redeemed, the amount will be truncated (see the `redeemableDebtTokenAmount`
 * property). When this happens, the redeemer can either redeem the truncated amount by sending the
 * transaction unchanged, or prepare a new transaction by
 * {@link @secured-finance/lib-base#PopulatedRedemption.increaseAmountByMinimumNetDebt | increasing the amount}
 * to the next lowest possible value, which is the sum of the truncated amount and
 * {@link @secured-finance/lib-base#MINIMUM_NET_DEBT}.
 *
 * @public
 */
export interface PopulatedRedemption<P = unknown, S = unknown, R = unknown>
  extends PopulatedLiquityTransaction<
    P,
    SentLiquityTransaction<S, LiquityReceipt<R, RedemptionDetails>>
  > {
  /** Amount of DebtToken the redeemer is trying to redeem. */
  readonly attemptedDebtTokenAmount: Decimal;

  /** Maximum amount of DebtToken that is currently redeemable from `attemptedDebtTokenAmount`. */
  readonly redeemableDebtTokenAmount: Decimal;

  /** Whether `redeemableDebtTokenAmount` is less than `attemptedDebtTokenAmount`. */
  readonly isTruncated: boolean;

  /**
   * Prepare a new transaction by increasing the attempted amount to the next lowest redeemable
   * value.
   *
   * @param maxRedemptionRate - Maximum acceptable
   *                            {@link @secured-finance/lib-base#Fees.redemptionRate | redemption rate} to
   *                            use in the new transaction.
   *
   * @remarks
   * If `maxRedemptionRate` is omitted, the original transaction's `maxRedemptionRate` is reused
   * unless that was also omitted, in which case the current redemption rate (based on the increased
   * amount) plus 0.1% is used as maximum acceptable rate.
   */
  increaseAmountByMinimumNetDebt(
    maxRedemptionRate?: Decimalish
  ): Promise<PopulatedRedemption<P, S, R>>;
}

/** @internal */
export type _PopulatableFrom<T, P> = {
  [M in keyof T]: T[M] extends (...args: infer A) => Promise<infer U>
    ? U extends SentLiquityTransaction
      ? (...args: A) => Promise<PopulatedLiquityTransaction<P, U>>
      : never
    : never;
};

/**
 * Prepare Liquity transactions for sending.
 *
 * @remarks
 * The functions return an object implementing {@link PopulatedLiquityTransaction}, which can be
 * used to send the transaction and get a {@link SentLiquityTransaction}.
 *
 * Implemented by {@link @secured-finance/lib-ethers#PopulatableEthersLiquity}.
 *
 * @public
 */
export interface PopulatableLiquity<R = unknown, S = unknown, P = unknown>
  extends _PopulatableFrom<SendableLiquity<R, S>, P> {
  // Methods re-declared for documentation purposes

  /** {@inheritDoc TransactableLiquity.openTrove} */
  openTrove(
    params: TroveCreationParams<Decimalish>,
    maxBorrowingRate?: Decimalish
  ): Promise<
    PopulatedLiquityTransaction<
      P,
      SentLiquityTransaction<S, LiquityReceipt<R, TroveCreationDetails>>
    >
  >;

  /** {@inheritDoc TransactableLiquity.closeTrove} */
  closeTrove(): Promise<
    PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, TroveClosureDetails>>>
  >;

  /** {@inheritDoc TransactableLiquity.adjustTrove} */
  adjustTrove(
    params: TroveAdjustmentParams<Decimalish>,
    maxBorrowingRate?: Decimalish
  ): Promise<
    PopulatedLiquityTransaction<
      P,
      SentLiquityTransaction<S, LiquityReceipt<R, TroveAdjustmentDetails>>
    >
  >;

  /** {@inheritDoc TransactableLiquity.depositCollateral} */
  depositCollateral(
    amount: Decimalish
  ): Promise<
    PopulatedLiquityTransaction<
      P,
      SentLiquityTransaction<S, LiquityReceipt<R, TroveAdjustmentDetails>>
    >
  >;

  /** {@inheritDoc TransactableLiquity.withdrawCollateral} */
  withdrawCollateral(
    amount: Decimalish
  ): Promise<
    PopulatedLiquityTransaction<
      P,
      SentLiquityTransaction<S, LiquityReceipt<R, TroveAdjustmentDetails>>
    >
  >;

  /** {@inheritDoc TransactableLiquity.borrowDebtToken} */
  borrowDebtToken(
    amount: Decimalish,
    maxBorrowingRate?: Decimalish
  ): Promise<
    PopulatedLiquityTransaction<
      P,
      SentLiquityTransaction<S, LiquityReceipt<R, TroveAdjustmentDetails>>
    >
  >;

  /** {@inheritDoc TransactableLiquity.repayDebtToken} */
  repayDebtToken(
    amount: Decimalish
  ): Promise<
    PopulatedLiquityTransaction<
      P,
      SentLiquityTransaction<S, LiquityReceipt<R, TroveAdjustmentDetails>>
    >
  >;

  /** @internal */
  setPrice(
    price: Decimalish
  ): Promise<PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, void>>>>;

  /** {@inheritDoc TransactableLiquity.liquidate} */
  liquidate(
    address: string | string[]
  ): Promise<
    PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, LiquidationDetails>>>
  >;

  /** {@inheritDoc TransactableLiquity.liquidateUpTo} */
  liquidateUpTo(
    maximumNumberOfTrovesToLiquidate: number
  ): Promise<
    PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, LiquidationDetails>>>
  >;

  /** {@inheritDoc TransactableLiquity.depositDebtTokenInStabilityPool} */
  depositDebtTokenInStabilityPool(
    amount: Decimalish,
    frontendTag?: string
  ): Promise<
    PopulatedLiquityTransaction<
      P,
      SentLiquityTransaction<S, LiquityReceipt<R, StabilityDepositChangeDetails>>
    >
  >;

  /** {@inheritDoc TransactableLiquity.withdrawDebtTokenFromStabilityPool} */
  withdrawDebtTokenFromStabilityPool(
    amount: Decimalish
  ): Promise<
    PopulatedLiquityTransaction<
      P,
      SentLiquityTransaction<S, LiquityReceipt<R, StabilityDepositChangeDetails>>
    >
  >;

  /** {@inheritDoc TransactableLiquity.withdrawGainsFromStabilityPool} */
  withdrawGainsFromStabilityPool(): Promise<
    PopulatedLiquityTransaction<
      P,
      SentLiquityTransaction<S, LiquityReceipt<R, StabilityPoolGainsWithdrawalDetails>>
    >
  >;

  /** {@inheritDoc TransactableLiquity.transferCollateralGainToTrove} */
  transferCollateralGainToTrove(): Promise<
    PopulatedLiquityTransaction<
      P,
      SentLiquityTransaction<S, LiquityReceipt<R, CollateralGainTransferDetails>>
    >
  >;

  /** {@inheritDoc TransactableLiquity.sendDebtToken} */
  sendDebtToken(
    toAddress: string,
    amount: Decimalish
  ): Promise<PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, void>>>>;

  /** {@inheritDoc TransactableLiquity.sendProtocolToken} */
  sendProtocolToken(
    toAddress: string,
    amount: Decimalish
  ): Promise<PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, void>>>>;

  /** {@inheritDoc TransactableLiquity.redeemDebtToken} */
  redeemDebtToken(
    amount: Decimalish,
    maxRedemptionRate?: Decimalish
  ): Promise<PopulatedRedemption<P, S, R>>;

  /** {@inheritDoc TransactableLiquity.claimCollateralSurplus} */
  claimCollateralSurplus(): Promise<
    PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, void>>>
  >;

  /** {@inheritDoc TransactableLiquity.stakeProtocolToken} */
  stakeProtocolToken(
    amount: Decimalish
  ): Promise<PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, void>>>>;

  /** {@inheritDoc TransactableLiquity.unstakeProtocolToken} */
  unstakeProtocolToken(
    amount: Decimalish
  ): Promise<PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, void>>>>;

  /** {@inheritDoc TransactableLiquity.withdrawGainsFromStaking} */
  withdrawGainsFromStaking(): Promise<
    PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, void>>>
  >;

  /** {@inheritDoc TransactableLiquity.approveUniTokens} */
  approveUniTokens(
    allowance?: Decimalish
  ): Promise<PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, void>>>>;

  /** {@inheritDoc TransactableLiquity.stakeUniTokens} */
  stakeUniTokens(
    amount: Decimalish
  ): Promise<PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, void>>>>;

  /** {@inheritDoc TransactableLiquity.unstakeUniTokens} */
  unstakeUniTokens(
    amount: Decimalish
  ): Promise<PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, void>>>>;

  /** {@inheritDoc TransactableLiquity.withdrawProtocolTokenRewardFromProtocolMining} */
  withdrawProtocolTokenRewardFromProtocolMining(): Promise<
    PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, void>>>
  >;

  /** {@inheritDoc TransactableLiquity.exitLiquidityMining} */
  exitLiquidityMining(): Promise<
    PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, void>>>
  >;

  /** {@inheritDoc TransactableLiquity.registerFrontend} */
  registerFrontend(
    kickbackRate: Decimalish
  ): Promise<PopulatedLiquityTransaction<P, SentLiquityTransaction<S, LiquityReceipt<R, void>>>>;
}
