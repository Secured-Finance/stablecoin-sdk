import { Decimal, Decimalish } from "./Decimal";
import { FailedReceipt } from "./SendableProtocol";
import { StabilityDepositChange } from "./StabilityDeposit";
import { Trove, TroveAdjustmentParams, TroveClosureParams, TroveCreationParams } from "./Trove";

/**
 * Thrown by {@link TransactableProtocol} functions in case of transaction failure.
 *
 * @public
 */
export class TransactionFailedError<T extends FailedReceipt = FailedReceipt> extends Error {
  readonly failedReceipt: T;

  /** @internal */
  constructor(name: string, message: string, failedReceipt: T) {
    super(message);
    this.name = name;
    this.failedReceipt = failedReceipt;
  }
}

/**
 * Details of an {@link TransactableProtocol.openTrove | openTrove()} transaction.
 *
 * @public
 */
export interface TroveCreationDetails {
  /** How much was deposited and borrowed. */
  params: TroveCreationParams<Decimal>;

  /** The Trove that was created by the transaction. */
  newTrove: Trove;

  /** Amount of DebtToken added to the Trove's debt as borrowing fee. */
  fee: Decimal;
}

/**
 * Details of an {@link TransactableProtocol.adjustTrove | adjustTrove()} transaction.
 *
 * @public
 */
export interface TroveAdjustmentDetails {
  /** Parameters of the adjustment. */
  params: TroveAdjustmentParams<Decimal>;

  /** New state of the adjusted Trove directly after the transaction. */
  newTrove: Trove;

  /** Amount of DebtToken added to the Trove's debt as borrowing fee. */
  fee: Decimal;
}

/**
 * Details of a {@link TransactableProtocol.closeTrove | closeTrove()} transaction.
 *
 * @public
 */
export interface TroveClosureDetails {
  /** How much was withdrawn and repaid. */
  params: TroveClosureParams<Decimal>;
}

/**
 * Details of a {@link TransactableProtocol.liquidate | liquidate()} or
 * {@link TransactableProtocol.liquidateUpTo | liquidateUpTo()} transaction.
 *
 * @public
 */
export interface LiquidationDetails {
  /** Addresses whose Troves were liquidated by the transaction. */
  liquidatedAddresses: string[];

  /** Total collateral liquidated and debt cleared by the transaction. */
  totalLiquidated: Trove;

  /** Amount of DebtToken paid to the liquidator as gas compensation. */
  debtGasCompensation: Decimal;

  /** Amount of native currency (e.g. Ether) paid to the liquidator as gas compensation. */
  collateralGasCompensation: Decimal;
}

/**
 * Details of a {@link TransactableProtocol.redeemDebtToken | redeemDebtToken()} transaction.
 *
 * @public
 */
export interface RedemptionDetails {
  /** Amount of DebtToken the redeemer tried to redeem. */
  attemptedDebtTokenAmount: Decimal;

  /**
   * Amount of DebtToken that was actually redeemed by the transaction.
   *
   * @remarks
   * This can end up being lower than `attemptedDebtTokenAmount` due to interference from another
   * transaction that modifies the list of Troves.
   *
   * @public
   */
  actualDebtTokenAmount: Decimal;

  /** Amount of collateral (e.g. Ether) taken from Troves by the transaction. */
  collateralTaken: Decimal;

  /** Amount of native currency (e.g. Ether) deducted as fee from collateral taken. */
  fee: Decimal;
}

/**
 * Details of a
 * {@link TransactableProtocol.withdrawGainsFromStabilityPool | withdrawGainsFromStabilityPool()}
 * transaction.
 *
 * @public
 */
export interface StabilityPoolGainsWithdrawalDetails {
  /** Amount of DebtToken burned from the deposit by liquidations since the last modification. */
  debtTokenLoss: Decimal;

  /** Amount of DebtToken in the deposit directly after this transaction. */
  newDebtTokenDeposit: Decimal;

  /** Amount of native currency (e.g. Ether) paid out to the depositor in this transaction. */
  collateralGain: Decimal;

  /** Amount of ProtocolToken rewarded to the depositor in this transaction. */
  protocolTokenReward: Decimal;
}

/**
 * Details of a
 * {@link TransactableProtocol.depositDebtTokenInStabilityPool | depositDebtTokenInStabilityPool()} or
 * {@link TransactableProtocol.withdrawDebtTokenFromStabilityPool | withdrawDebtTokenFromStabilityPool()}
 * transaction.
 *
 * @public
 */
export interface StabilityDepositChangeDetails extends StabilityPoolGainsWithdrawalDetails {
  /** Change that was made to the deposit by this transaction. */
  change: StabilityDepositChange<Decimal>;
}

/**
 * Details of a
 * {@link TransactableProtocol.transferCollateralGainToTrove | transferCollateralGainToTrove()}
 * transaction.
 *
 * @public
 */
export interface CollateralGainTransferDetails extends StabilityPoolGainsWithdrawalDetails {
  /** New state of the depositor's Trove directly after the transaction. */
  newTrove: Trove;
}

/**
 * Send transactions and wait for them to succeed.
 *
 * @remarks
 * The functions return the details of the transaction (if any), or throw an implementation-specific
 * subclass of {@link TransactionFailedError} in case of transaction failure.
 *
 * Implemented by {@link @secured-finance/stablecoin-lib-ethers#EthersSfStablecoin}.
 *
 * @public
 */
export interface TransactableProtocol {
  /**
   * Open a new Trove by depositing collateral and borrowing DebtToken.
   *
   * @param params - How much to deposit and borrow.
   * @param maxBorrowingRate - Maximum acceptable
   *                           {@link @secured-finance/stablecoin-lib-base#Fees.borrowingRate | borrowing rate}.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * If `maxBorrowingRate` is omitted, the current borrowing rate plus 0.5% is used as maximum
   * acceptable rate.
   */
  openTrove(
    params: TroveCreationParams<Decimalish>,
    maxBorrowingRate?: Decimalish
  ): Promise<TroveCreationDetails>;

  /**
   * Close existing Trove by repaying all debt and withdrawing all collateral.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  closeTrove(): Promise<TroveClosureDetails>;

  /**
   * Adjust existing Trove by changing its collateral, debt, or both.
   *
   * @param params - Parameters of the adjustment.
   * @param maxBorrowingRate - Maximum acceptable
   *                           {@link @secured-finance/stablecoin-lib-base#Fees.borrowingRate | borrowing rate} if
   *                           `params` includes `borrowDebtToken`.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * The transaction will fail if the Trove's debt would fall below
   * {@link @secured-finance/stablecoin-lib-base#MINIMUM_DEBT}.
   *
   * If `maxBorrowingRate` is omitted, the current borrowing rate plus 0.5% is used as maximum
   * acceptable rate.
   */
  adjustTrove(
    params: TroveAdjustmentParams<Decimalish>,
    maxBorrowingRate?: Decimalish
  ): Promise<TroveAdjustmentDetails>;

  /**
   * Adjust existing Trove by depositing more collateral.
   *
   * @param amount - The amount of collateral to add to the Trove's existing collateral.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * Equivalent to:
   *
   * ```typescript
   * adjustTrove({ depositCollateral: amount })
   * ```
   */
  depositCollateral(amount: Decimalish): Promise<TroveAdjustmentDetails>;

  /**
   * Adjust existing Trove by withdrawing some of its collateral.
   *
   * @param amount - The amount of collateral to withdraw from the Trove.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * Equivalent to:
   *
   * ```typescript
   * adjustTrove({ withdrawCollateral: amount })
   * ```
   */
  withdrawCollateral(amount: Decimalish): Promise<TroveAdjustmentDetails>;

  /**
   * Adjust existing Trove by borrowing more DebtToken.
   *
   * @param amount - The amount of DebtToken to borrow.
   * @param maxBorrowingRate - Maximum acceptable
   *                           {@link @secured-finance/stablecoin-lib-base#Fees.borrowingRate | borrowing rate}.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * Equivalent to:
   *
   * ```typescript
   * adjustTrove({ borrowDebtToken: amount }, maxBorrowingRate)
   * ```
   */
  borrowDebtToken(
    amount: Decimalish,
    maxBorrowingRate?: Decimalish
  ): Promise<TroveAdjustmentDetails>;

  /**
   * Adjust existing Trove by repaying some of its debt.
   *
   * @param amount - The amount of DebtToken to repay.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * Equivalent to:
   *
   * ```typescript
   * adjustTrove({ repayDebtToken: amount })
   * ```
   */
  repayDebtToken(amount: Decimalish): Promise<TroveAdjustmentDetails>;

  /** @internal */
  setPrice(price: Decimalish): Promise<void>;

  /**
   * Liquidate one or more undercollateralized Troves.
   *
   * @param address - Address or array of addresses whose Troves to liquidate.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  liquidate(address: string | string[]): Promise<LiquidationDetails>;

  /**
   * Liquidate the least collateralized Troves up to a maximum number.
   *
   * @param maximumNumberOfTrovesToLiquidate - Stop after liquidating this many Troves.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  liquidateUpTo(maximumNumberOfTrovesToLiquidate: number): Promise<LiquidationDetails>;

  /**
   * Make a new Stability Deposit, or top up existing one.
   *
   * @param amount - Amount of DebtToken to add to new or existing deposit.
   * @param frontendTag - Address that should receive a share of this deposit's ProtocolToken rewards.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * The `frontendTag` parameter is only effective when making a new deposit.
   *
   * As a side-effect, the transaction will also pay out an existing Stability Deposit's
   * {@link @secured-finance/stablecoin-lib-base#StabilityDeposit.collateralGain | collateral gain} and
   * {@link @secured-finance/stablecoin-lib-base#StabilityDeposit.protocolTokenReward | ProtocolToken reward}.
   */
  depositDebtTokenInStabilityPool(
    amount: Decimalish,
    frontendTag?: string
  ): Promise<StabilityDepositChangeDetails>;

  /**
   * Withdraw DebtToken from Stability Deposit.
   *
   * @param amount - Amount of DebtToken to withdraw.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * As a side-effect, the transaction will also pay out the Stability Deposit's
   * {@link @secured-finance/stablecoin-lib-base#StabilityDeposit.collateralGain | collateral gain} and
   * {@link @secured-finance/stablecoin-lib-base#StabilityDeposit.protocolTokenReward | ProtocolToken reward}.
   */
  withdrawDebtTokenFromStabilityPool(amount: Decimalish): Promise<StabilityDepositChangeDetails>;

  /**
   * Withdraw {@link @secured-finance/stablecoin-lib-base#StabilityDeposit.collateralGain | collateral gain} and
   * {@link @secured-finance/stablecoin-lib-base#StabilityDeposit.protocolTokenReward | ProtocolToken reward} from Stability Deposit.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  withdrawGainsFromStabilityPool(): Promise<StabilityPoolGainsWithdrawalDetails>;

  /**
   * Transfer {@link @secured-finance/stablecoin-lib-base#StabilityDeposit.collateralGain | collateral gain} from
   * Stability Deposit to Trove.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * The collateral gain is transfered to the Trove as additional collateral.
   *
   * As a side-effect, the transaction will also pay out the Stability Deposit's
   * {@link @secured-finance/stablecoin-lib-base#StabilityDeposit.protocolTokenReward | ProtocolToken reward}.
   */
  transferCollateralGainToTrove(): Promise<CollateralGainTransferDetails>;

  /**
   * Send DebtToken tokens to an address.
   *
   * @param toAddress - Address of receipient.
   * @param amount - Amount of DebtToken to send.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  sendDebtToken(toAddress: string, amount: Decimalish): Promise<void>;

  /**
   * Send ProtocolTokens to an address.
   *
   * @param toAddress - Address of receipient.
   * @param amount - Amount of ProtocolToken to send.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  sendProtocolToken(toAddress: string, amount: Decimalish): Promise<void>;

  /**
   * Redeem DebtToken to native currency (e.g. Ether) at face value.
   *
   * @param amount - Amount of DebtToken to be redeemed.
   * @param maxRedemptionRate - Maximum acceptable
   *                            {@link @secured-finance/stablecoin-lib-base#Fees.redemptionRate | redemption rate}.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * If `maxRedemptionRate` is omitted, the current redemption rate (based on `amount`) plus 0.1%
   * is used as maximum acceptable rate.
   */
  redeemDebtToken(amount: Decimalish, maxRedemptionRate?: Decimalish): Promise<RedemptionDetails>;

  /**
   * Claim leftover collateral after a liquidation or redemption.
   *
   * @remarks
   * Use {@link @secured-finance/stablecoin-lib-base#ReadableProtocol.getCollateralSurplusBalance | getCollateralSurplusBalance()}
   * to check the amount of collateral available for withdrawal.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  claimCollateralSurplus(): Promise<void>;

  /**
   * Stake ProtocolToken to start earning fee revenue or increase existing stake.
   *
   * @param amount - Amount of ProtocolToken to add to new or existing stake.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * As a side-effect, the transaction will also pay out an existing ProtocolToken stake's
   * {@link @secured-finance/stablecoin-lib-base#ProtocolTokenStake.collateralGain | collateral gain} and
   * {@link @secured-finance/stablecoin-lib-base#ProtocolTokenStake.debtTokenGain | DebtToken gain}.
   */
  stakeProtocolToken(amount: Decimalish): Promise<void>;

  /**
   * Withdraw ProtocolToken from staking.
   *
   * @param amount - Amount of ProtocolToken to withdraw.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * As a side-effect, the transaction will also pay out the ProtocolToken stake's
   * {@link @secured-finance/stablecoin-lib-base#ProtocolTokenStake.collateralGain | collateral gain} and
   * {@link @secured-finance/stablecoin-lib-base#ProtocolTokenStake.debtTokenGain | DebtToken gain}.
   */
  unstakeProtocolToken(amount: Decimalish): Promise<void>;

  /**
   * Withdraw {@link @secured-finance/stablecoin-lib-base#ProtocolTokenStake.collateralGain | collateral gain} and
   * {@link @secured-finance/stablecoin-lib-base#ProtocolTokenStake.debtTokenGain | DebtToken gain} from ProtocolToken stake.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  withdrawGainsFromStaking(): Promise<void>;

  /**
   * Allow the liquidity mining contract to use Uniswap FIL/DebtToken LP tokens for
   * {@link @secured-finance/stablecoin-lib-base#TransactableProtocol.stakeUniTokens | staking}.
   *
   * @param allowance - Maximum amount of LP tokens that will be transferrable to liquidity mining
   *                    (`2^256 - 1` by default).
   *
   * @remarks
   * Must be performed before calling
   * {@link @secured-finance/stablecoin-lib-base#TransactableProtocol.stakeUniTokens | stakeUniTokens()}.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  approveUniTokens(allowance?: Decimalish): Promise<void>;

  /**
   * Stake Uniswap FIL/DebtToken LP tokens to participate in liquidity mining and earn ProtocolToken.
   *
   * @param amount - Amount of LP tokens to add to new or existing stake.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  stakeUniTokens(amount: Decimalish): Promise<void>;

  /**
   * Withdraw Uniswap FIL/DebtToken LP tokens from liquidity mining.
   *
   * @param amount - Amount of LP tokens to withdraw.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  unstakeUniTokens(amount: Decimalish): Promise<void>;

  /**
   * Withdraw ProtocolToken that has been earned by mining liquidity.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  withdrawProtocolTokenRewardFromProtocolMining(): Promise<void>;

  /**
   * Withdraw all staked LP tokens from liquidity mining and claim reward.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  exitLiquidityMining(): Promise<void>;

  /**
   * Register current wallet address as a frontend.
   *
   * @param kickbackRate - The portion of ProtocolToken rewards to pass onto users of the frontend
   *                       (between 0 and 1).
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  registerFrontend(kickbackRate: Decimalish): Promise<void>;
}
