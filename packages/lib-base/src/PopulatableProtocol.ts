import { Decimal, Decimalish } from "./Decimal";
import { ProtocolReceipt, SendableProtocol, SentProtocolTransaction } from "./SendableProtocol";
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
} from "./TransactableProtocol";

/**
 * A transaction that has been prepared for sending.
 *
 * @remarks
 * Implemented by {@link @secured-finance/stablecoin-lib-ethers#PopulatedEthersTransaction}.
 *
 * @public
 */
export interface PopulatedTransactionInterface<
  P = unknown,
  T extends SentProtocolTransaction = SentProtocolTransaction
> {
  /** Implementation-specific populated transaction object. */
  readonly rawPopulatedTransaction: P;

  /**
   * Send the transaction.
   *
   * @returns An object that implements {@link @secured-finance/stablecoin-lib-base#SentProtocolTransaction}.
   */
  send(): Promise<T>;
}

/**
 * A redemption transaction that has been prepared for sending.
 *
 * @remarks
 * The protocol fulfills redemptions by repaying the debt of Troves in ascending order of
 * their collateralization ratio, and taking a portion of their collateral in exchange. Due to the
 * {@link @secured-finance/stablecoin-lib-base#MINIMUM_DEBT | minimum debt} requirement that Troves must fulfill,
 * some DebtToken amounts are not possible to redeem exactly.
 *
 * When {@link @secured-finance/stablecoin-lib-base#PopulatableProtocol.redeemDebtToken | redeemDebtToken()} is called with an
 * amount that can't be fully redeemed, the amount will be truncated (see the `redeemableDebtTokenAmount`
 * property). When this happens, the redeemer can either redeem the truncated amount by sending the
 * transaction unchanged, or prepare a new transaction by
 * {@link @secured-finance/stablecoin-lib-base#PopulatedRedemptionInterface.increaseAmountByMinimumNetDebt | increasing the amount}
 * to the next lowest possible value, which is the sum of the truncated amount and
 * {@link @secured-finance/stablecoin-lib-base#MINIMUM_NET_DEBT}.
 *
 * @public
 */
export interface PopulatedRedemptionInterface<P = unknown, S = unknown, R = unknown>
  extends PopulatedTransactionInterface<
    P,
    SentProtocolTransaction<S, ProtocolReceipt<R, RedemptionDetails>>
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
   *                            {@link @secured-finance/stablecoin-lib-base#Fees.redemptionRate | redemption rate} to
   *                            use in the new transaction.
   *
   * @remarks
   * If `maxRedemptionRate` is omitted, the original transaction's `maxRedemptionRate` is reused
   * unless that was also omitted, in which case the current redemption rate (based on the increased
   * amount) plus 0.1% is used as maximum acceptable rate.
   */
  increaseAmountByMinimumNetDebt(
    maxRedemptionRate?: Decimalish
  ): Promise<PopulatedRedemptionInterface<P, S, R>>;
}

/** @internal */
export type _PopulatableFrom<T, P> = {
  [M in keyof T]: T[M] extends (...args: infer A) => Promise<infer U>
    ? U extends SentProtocolTransaction
      ? (...args: A) => Promise<PopulatedTransactionInterface<P, U>>
      : never
    : never;
};

/**
 * Prepare transactions for sending.
 *
 * @remarks
 * The functions return an object implementing {@link PopulatedTransactionInterface}, which can be
 * used to send the transaction and get a {@link SentProtocolTransaction}.
 *
 * Implemented by {@link @secured-finance/stablecoin-lib-ethers#PopulatableEthers}.
 *
 * @public
 */
export interface PopulatableProtocol<R = unknown, S = unknown, P = unknown>
  extends _PopulatableFrom<SendableProtocol<R, S>, P> {
  // Methods re-declared for documentation purposes

  /** {@inheritDoc TransactableProtocol.openTrove} */
  openTrove(
    params: TroveCreationParams<Decimalish>,
    maxBorrowingRate?: Decimalish
  ): Promise<
    PopulatedTransactionInterface<
      P,
      SentProtocolTransaction<S, ProtocolReceipt<R, TroveCreationDetails>>
    >
  >;

  /** {@inheritDoc TransactableProtocol.closeTrove} */
  closeTrove(): Promise<
    PopulatedTransactionInterface<
      P,
      SentProtocolTransaction<S, ProtocolReceipt<R, TroveClosureDetails>>
    >
  >;

  /** {@inheritDoc TransactableProtocol.adjustTrove} */
  adjustTrove(
    params: TroveAdjustmentParams<Decimalish>,
    maxBorrowingRate?: Decimalish
  ): Promise<
    PopulatedTransactionInterface<
      P,
      SentProtocolTransaction<S, ProtocolReceipt<R, TroveAdjustmentDetails>>
    >
  >;

  /** {@inheritDoc TransactableProtocol.depositCollateral} */
  depositCollateral(
    amount: Decimalish
  ): Promise<
    PopulatedTransactionInterface<
      P,
      SentProtocolTransaction<S, ProtocolReceipt<R, TroveAdjustmentDetails>>
    >
  >;

  /** {@inheritDoc TransactableProtocol.withdrawCollateral} */
  withdrawCollateral(
    amount: Decimalish
  ): Promise<
    PopulatedTransactionInterface<
      P,
      SentProtocolTransaction<S, ProtocolReceipt<R, TroveAdjustmentDetails>>
    >
  >;

  /** {@inheritDoc TransactableProtocol.borrowDebtToken} */
  borrowDebtToken(
    amount: Decimalish,
    maxBorrowingRate?: Decimalish
  ): Promise<
    PopulatedTransactionInterface<
      P,
      SentProtocolTransaction<S, ProtocolReceipt<R, TroveAdjustmentDetails>>
    >
  >;

  /** {@inheritDoc TransactableProtocol.repayDebtToken} */
  repayDebtToken(
    amount: Decimalish
  ): Promise<
    PopulatedTransactionInterface<
      P,
      SentProtocolTransaction<S, ProtocolReceipt<R, TroveAdjustmentDetails>>
    >
  >;

  /** @internal */
  setPrice(
    price: Decimalish
  ): Promise<PopulatedTransactionInterface<P, SentProtocolTransaction<S, ProtocolReceipt<R, void>>>>;

  /** {@inheritDoc TransactableProtocol.liquidate} */
  liquidate(
    address: string | string[]
  ): Promise<
    PopulatedTransactionInterface<
      P,
      SentProtocolTransaction<S, ProtocolReceipt<R, LiquidationDetails>>
    >
  >;

  /** {@inheritDoc TransactableProtocol.liquidateUpTo} */
  liquidateUpTo(
    maximumNumberOfTrovesToLiquidate: number
  ): Promise<
    PopulatedTransactionInterface<
      P,
      SentProtocolTransaction<S, ProtocolReceipt<R, LiquidationDetails>>
    >
  >;

  /** {@inheritDoc TransactableProtocol.depositDebtTokenInStabilityPool} */
  depositDebtTokenInStabilityPool(
    amount: Decimalish,
    frontendTag?: string
  ): Promise<
    PopulatedTransactionInterface<
      P,
      SentProtocolTransaction<S, ProtocolReceipt<R, StabilityDepositChangeDetails>>
    >
  >;

  /** {@inheritDoc TransactableProtocol.withdrawDebtTokenFromStabilityPool} */
  withdrawDebtTokenFromStabilityPool(
    amount: Decimalish
  ): Promise<
    PopulatedTransactionInterface<
      P,
      SentProtocolTransaction<S, ProtocolReceipt<R, StabilityDepositChangeDetails>>
    >
  >;

  /** {@inheritDoc TransactableProtocol.withdrawGainsFromStabilityPool} */
  withdrawGainsFromStabilityPool(): Promise<
    PopulatedTransactionInterface<
      P,
      SentProtocolTransaction<S, ProtocolReceipt<R, StabilityPoolGainsWithdrawalDetails>>
    >
  >;

  /** {@inheritDoc TransactableProtocol.transferCollateralGainToTrove} */
  transferCollateralGainToTrove(): Promise<
    PopulatedTransactionInterface<
      P,
      SentProtocolTransaction<S, ProtocolReceipt<R, CollateralGainTransferDetails>>
    >
  >;

  /** {@inheritDoc TransactableProtocol.sendDebtToken} */
  sendDebtToken(
    toAddress: string,
    amount: Decimalish
  ): Promise<PopulatedTransactionInterface<P, SentProtocolTransaction<S, ProtocolReceipt<R, void>>>>;

  /** {@inheritDoc TransactableProtocol.sendProtocolToken} */
  sendProtocolToken(
    toAddress: string,
    amount: Decimalish
  ): Promise<PopulatedTransactionInterface<P, SentProtocolTransaction<S, ProtocolReceipt<R, void>>>>;

  /** {@inheritDoc TransactableProtocol.redeemDebtToken} */
  redeemDebtToken(
    amount: Decimalish,
    maxRedemptionRate?: Decimalish
  ): Promise<PopulatedRedemptionInterface<P, S, R>>;

  /** {@inheritDoc TransactableProtocol.claimCollateralSurplus} */
  claimCollateralSurplus(): Promise<
    PopulatedTransactionInterface<P, SentProtocolTransaction<S, ProtocolReceipt<R, void>>>
  >;

  /** {@inheritDoc TransactableProtocol.stakeProtocolToken} */
  stakeProtocolToken(
    amount: Decimalish
  ): Promise<PopulatedTransactionInterface<P, SentProtocolTransaction<S, ProtocolReceipt<R, void>>>>;

  /** {@inheritDoc TransactableProtocol.unstakeProtocolToken} */
  unstakeProtocolToken(
    amount: Decimalish
  ): Promise<PopulatedTransactionInterface<P, SentProtocolTransaction<S, ProtocolReceipt<R, void>>>>;

  /** {@inheritDoc TransactableProtocol.withdrawGainsFromStaking} */
  withdrawGainsFromStaking(): Promise<
    PopulatedTransactionInterface<P, SentProtocolTransaction<S, ProtocolReceipt<R, void>>>
  >;

  /** {@inheritDoc TransactableProtocol.approveUniTokens} */
  approveUniTokens(
    allowance?: Decimalish
  ): Promise<PopulatedTransactionInterface<P, SentProtocolTransaction<S, ProtocolReceipt<R, void>>>>;

  /** {@inheritDoc TransactableProtocol.stakeUniTokens} */
  stakeUniTokens(
    amount: Decimalish
  ): Promise<PopulatedTransactionInterface<P, SentProtocolTransaction<S, ProtocolReceipt<R, void>>>>;

  /** {@inheritDoc TransactableProtocol.unstakeUniTokens} */
  unstakeUniTokens(
    amount: Decimalish
  ): Promise<PopulatedTransactionInterface<P, SentProtocolTransaction<S, ProtocolReceipt<R, void>>>>;

  /** {@inheritDoc TransactableProtocol.withdrawProtocolTokenRewardFromProtocolMining} */
  withdrawProtocolTokenRewardFromProtocolMining(): Promise<
    PopulatedTransactionInterface<P, SentProtocolTransaction<S, ProtocolReceipt<R, void>>>
  >;

  /** {@inheritDoc TransactableProtocol.exitLiquidityMining} */
  exitLiquidityMining(): Promise<
    PopulatedTransactionInterface<P, SentProtocolTransaction<S, ProtocolReceipt<R, void>>>
  >;

  /** {@inheritDoc TransactableProtocol.registerFrontend} */
  registerFrontend(
    kickbackRate: Decimalish
  ): Promise<PopulatedTransactionInterface<P, SentProtocolTransaction<S, ProtocolReceipt<R, void>>>>;
}
