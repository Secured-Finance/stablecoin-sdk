import assert from "assert";

import { Log } from "@ethersproject/abstract-provider";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { AddressZero } from "@ethersproject/constants";
import { ErrorCode } from "@ethersproject/logger";
import { Transaction } from "@ethersproject/transactions";

import {
  CollateralGainTransferDetails,
  Decimal,
  Decimalish,
  LiquidationDetails,
  MINIMUM_DEBT,
  MINIMUM_NET_DEBT,
  MinedReceipt,
  PopulatableProtocol,
  PopulatedRedemptionInterface,
  PopulatedTransactionInterface,
  ProtocolReceipt,
  RedemptionDetails,
  SentProtocolTransaction,
  StabilityDepositChangeDetails,
  StabilityPoolGainsWithdrawalDetails,
  Trove,
  TroveAdjustmentDetails,
  TroveAdjustmentParams,
  TroveClosureDetails,
  TroveCreationDetails,
  TroveCreationParams,
  TroveWithPendingRedistribution,
  _failedReceipt,
  _normalizeTroveAdjustment,
  _normalizeTroveCreation,
  _pendingReceipt,
  _successfulReceipt
} from "@secured-finance/stablecoin-lib-base";

import {
  EthersPopulatedTransaction,
  EthersTransactionOverrides,
  EthersTransactionReceipt,
  EthersTransactionResponse
} from "./types";

import {
  EthersConnection,
  _getContracts,
  _requireAddress,
  _requireSigner
} from "./EthersConnection";

import { decimalify, promiseAllValues } from "./_utils";
import { _priceFeedIsTestnet, _uniTokenIsMock } from "./contracts";
import { logsToString } from "./parseLogs";
import { ReadableEthers, redeemMaxIterations } from "./ReadableEthers";

const bigNumberMax = (a: BigNumber, b?: BigNumber) => (b?.gt(a) ? b : a);

const defaultBorrowingRateSlippageTolerance = Decimal.from(0.005); // 0.5%
const defaultRedemptionRateSlippageTolerance = Decimal.from(0.001); // 0.1%
const defaultBorrowingFeeDecayToleranceMinutes = 10;

const noDetails = () => undefined;

const compose =
  <T, U, V>(f: (_: U) => V, g: (_: T) => U) =>
  (_: T) =>
    f(g(_));

const id = <T>(t: T) => t;

// Takes ~6-7K (use 10K to be safe) to update lastFeeOperationTime, but the cost of calculating the
// decayed baseRate increases logarithmically with time elapsed since the last update.
const addGasForBaseRateUpdate =
  (maxMinutesSinceLastUpdate = 10) =>
  (gas: BigNumber) =>
    gas.add(10000 + 1414 * Math.ceil(Math.log2(maxMinutesSinceLastUpdate + 1)));

// First traversal in ascending direction takes ~50K, then ~13.5K per extra step.
// 80K should be enough for 3 steps, plus some extra to be safe.
const addGasForPotentialListTraversal = (gas: BigNumber) => gas.add(80000);

const addGasForProtocolTokenIssuance = (gas: BigNumber) => gas.add(50000);

const addGasForUnipoolRewardUpdate = (gas: BigNumber) => gas.add(20000);

/** @internal */
export enum _RawErrorReason {
  TRANSACTION_FAILED = "transaction failed",
  TRANSACTION_CANCELLED = "cancelled",
  TRANSACTION_REPLACED = "replaced",
  TRANSACTION_REPRICED = "repriced"
}

const transactionReplacementReasons: unknown[] = [
  _RawErrorReason.TRANSACTION_CANCELLED,
  _RawErrorReason.TRANSACTION_REPLACED,
  _RawErrorReason.TRANSACTION_REPRICED
];

interface RawTransactionFailedError extends Error {
  code: ErrorCode.CALL_EXCEPTION;
  reason: _RawErrorReason.TRANSACTION_FAILED;
  transactionHash: string;
  transaction: Transaction;
  receipt: EthersTransactionReceipt;
}

/** @internal */
export interface _RawTransactionReplacedError extends Error {
  code: ErrorCode.TRANSACTION_REPLACED;
  reason:
    | _RawErrorReason.TRANSACTION_CANCELLED
    | _RawErrorReason.TRANSACTION_REPLACED
    | _RawErrorReason.TRANSACTION_REPRICED;
  cancelled: boolean;
  hash: string;
  replacement: EthersTransactionResponse;
  receipt: EthersTransactionReceipt;
}

const hasProp = <T, P extends string>(o: T, p: P): o is T & { [_ in P]: unknown } => p in o;

const isTransactionFailedError = (error: Error): error is RawTransactionFailedError =>
  hasProp(error, "code") &&
  error.code === ErrorCode.CALL_EXCEPTION &&
  hasProp(error, "reason") &&
  error.reason === _RawErrorReason.TRANSACTION_FAILED;

const isTransactionReplacedError = (error: Error): error is _RawTransactionReplacedError =>
  hasProp(error, "code") &&
  error.code === ErrorCode.TRANSACTION_REPLACED &&
  hasProp(error, "reason") &&
  transactionReplacementReasons.includes(error.reason);

/**
 * Thrown when a transaction is cancelled or replaced by a different transaction.
 *
 * @public
 */
export class EthersTransactionCancelledError extends Error {
  readonly rawReplacementReceipt: EthersTransactionReceipt;
  readonly rawError: Error;

  /** @internal */
  constructor(rawError: _RawTransactionReplacedError) {
    assert(rawError.reason !== _RawErrorReason.TRANSACTION_REPRICED);

    super(`Transaction ${rawError.reason}`);
    this.name = "TransactionCancelledError";
    this.rawReplacementReceipt = rawError.receipt;
    this.rawError = rawError;
  }
}

/**
 * A transaction that has already been sent.
 *
 * @remarks
 * Returned by {@link SendableEthers} functions.
 *
 * @public
 */
export class SentEthersTransaction<T = unknown>
  implements
    SentProtocolTransaction<EthersTransactionResponse, ProtocolReceipt<EthersTransactionReceipt, T>>
{
  /** Ethers' representation of a sent transaction. */
  readonly rawSentTransaction: EthersTransactionResponse;

  private readonly _connection: EthersConnection;
  private readonly _parse: (rawReceipt: EthersTransactionReceipt) => T;

  /** @internal */
  constructor(
    rawSentTransaction: EthersTransactionResponse,
    connection: EthersConnection,
    parse: (rawReceipt: EthersTransactionReceipt) => T
  ) {
    this.rawSentTransaction = rawSentTransaction;
    this._connection = connection;
    this._parse = parse;
  }

  private _receiptFrom(rawReceipt: EthersTransactionReceipt | null) {
    return rawReceipt
      ? rawReceipt.status
        ? _successfulReceipt(rawReceipt, this._parse(rawReceipt), () =>
            logsToString(rawReceipt, _getContracts(this._connection))
          )
        : _failedReceipt(rawReceipt)
      : _pendingReceipt;
  }

  private async _waitForRawReceipt(confirmations?: number) {
    try {
      return await this.rawSentTransaction.wait(confirmations);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (isTransactionFailedError(error)) {
          return error.receipt;
        }

        if (isTransactionReplacedError(error)) {
          if (error.cancelled) {
            throw new EthersTransactionCancelledError(error);
          } else {
            return error.receipt;
          }
        }
      }

      throw error;
    }
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SentProtocolTransaction.getReceipt} */
  async getReceipt(): Promise<ProtocolReceipt<EthersTransactionReceipt, T>> {
    return this._receiptFrom(await this._waitForRawReceipt(0));
  }

  /**
   * {@inheritDoc @secured-finance/stablecoin-lib-base#SentProtocolTransaction.waitForReceipt}
   *
   * @throws
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  async waitForReceipt(): Promise<MinedReceipt<EthersTransactionReceipt, T>> {
    const receipt = this._receiptFrom(await this._waitForRawReceipt());

    assert(receipt.status !== "pending");
    return receipt;
  }
}

/**
 * Optional parameters of a transaction that borrows DebtToken.
 *
 * @public
 */
export interface BorrowingOperationOptionalParams {
  /**
   * Maximum acceptable {@link @secured-finance/stablecoin-lib-base#Fees.borrowingRate | borrowing rate}
   * (default: current borrowing rate plus 0.5%).
   */
  maxBorrowingRate?: Decimalish;

  /**
   * Control the amount of extra gas included attached to the transaction.
   *
   * @remarks
   * Transactions that borrow DebtToken must pay a variable borrowing fee, which is added to the Trove's
   * debt. This fee increases whenever a redemption occurs, and otherwise decays exponentially.
   * Due to this decay, a Trove's collateral ratio can end up being higher than initially calculated
   * if the transaction is pending for a long time. When this happens, the backend has to iterate
   * over the sorted list of Troves to find a new position for the Trove, which costs extra gas.
   *
   * The SDK can estimate how much the gas costs of the transaction may increase due to this decay,
   * and can include additional gas to ensure that it will still succeed, even if it ends up pending
   * for a relatively long time. This parameter specifies the length of time that should be covered
   * by the extra gas.
   *
   * Default: 10 minutes.
   */
  borrowingFeeDecayToleranceMinutes?: number;
}

const normalizeBorrowingOperationOptionalParams = (
  maxBorrowingRateOrOptionalParams: Decimalish | BorrowingOperationOptionalParams | undefined,
  currentBorrowingRate: Decimal | undefined
): {
  maxBorrowingRate: Decimal;
  borrowingFeeDecayToleranceMinutes: number;
} => {
  if (maxBorrowingRateOrOptionalParams === undefined) {
    return {
      maxBorrowingRate:
        currentBorrowingRate?.add(defaultBorrowingRateSlippageTolerance) ?? Decimal.ZERO,
      borrowingFeeDecayToleranceMinutes: defaultBorrowingFeeDecayToleranceMinutes
    };
  } else if (
    typeof maxBorrowingRateOrOptionalParams === "number" ||
    typeof maxBorrowingRateOrOptionalParams === "string" ||
    maxBorrowingRateOrOptionalParams instanceof Decimal
  ) {
    return {
      maxBorrowingRate: Decimal.from(maxBorrowingRateOrOptionalParams),
      borrowingFeeDecayToleranceMinutes: defaultBorrowingFeeDecayToleranceMinutes
    };
  } else {
    const { maxBorrowingRate, borrowingFeeDecayToleranceMinutes } = maxBorrowingRateOrOptionalParams;

    return {
      maxBorrowingRate:
        maxBorrowingRate !== undefined
          ? Decimal.from(maxBorrowingRate)
          : currentBorrowingRate?.add(defaultBorrowingRateSlippageTolerance) ?? Decimal.ZERO,

      borrowingFeeDecayToleranceMinutes:
        borrowingFeeDecayToleranceMinutes ?? defaultBorrowingFeeDecayToleranceMinutes
    };
  }
};

/**
 * A transaction that has been prepared for sending.
 *
 * @remarks
 * Returned by {@link PopulatableEthers} functions.
 *
 * @public
 */
export class PopulatedEthersTransaction<T = unknown>
  implements PopulatedTransactionInterface<EthersPopulatedTransaction, SentEthersTransaction<T>>
{
  /** Unsigned transaction object populated by Ethers. */
  readonly rawPopulatedTransaction: EthersPopulatedTransaction;

  /**
   * Extra gas added to the transaction's `gasLimit` on top of the estimated minimum requirement.
   *
   * @remarks
   * Gas estimation is based on blockchain state at the latest block. However, most transactions
   * stay in pending state for several blocks before being included in a block. This may increase
   * the actual gas requirements of certain transactions by the time they are eventually
   * mined, therefore the SDK increases these transactions' `gasLimit` by default (unless
   * `gasLimit` is {@link EthersTransactionOverrides | overridden}).
   *
   * Note: even though the SDK includes gas headroom for many transaction types, currently this
   * property is only implemented for {@link PopulatableEthers.openTrove | openTrove()},
   * {@link PopulatableEthers.adjustTrove | adjustTrove()} and its aliases.
   */
  readonly gasHeadroom?: number;

  private readonly _connection: EthersConnection;
  private readonly _parse: (rawReceipt: EthersTransactionReceipt) => T;

  /** @internal */
  constructor(
    rawPopulatedTransaction: EthersPopulatedTransaction,
    connection: EthersConnection,
    parse: (rawReceipt: EthersTransactionReceipt) => T,
    gasHeadroom?: number
  ) {
    this.rawPopulatedTransaction = rawPopulatedTransaction;
    this._connection = connection;
    this._parse = parse;

    if (gasHeadroom !== undefined) {
      this.gasHeadroom = gasHeadroom;
    }
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatedTransactionInterface.send} */
  async send(): Promise<SentEthersTransaction<T>> {
    return new SentEthersTransaction(
      await _requireSigner(this._connection).sendTransaction(this.rawPopulatedTransaction),
      this._connection,
      this._parse
    );
  }
}

/**
 * {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatedRedemptionInterface}
 *
 * @public
 */
export class PopulatedEthersRedemption
  extends PopulatedEthersTransaction<RedemptionDetails>
  implements
    PopulatedRedemptionInterface<
      EthersPopulatedTransaction,
      EthersTransactionResponse,
      EthersTransactionReceipt
    >
{
  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatedRedemptionInterface.attemptedDebtTokenAmount} */
  readonly attemptedDebtTokenAmount: Decimal;

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatedRedemptionInterface.redeemableDebtTokenAmount} */
  readonly redeemableDebtTokenAmount: Decimal;

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatedRedemptionInterface.isTruncated} */
  readonly isTruncated: boolean;

  private readonly _increaseAmountByMinimumNetDebt?: (
    maxRedemptionRate?: Decimalish
  ) => Promise<PopulatedEthersRedemption>;

  /** @internal */
  constructor(
    rawPopulatedTransaction: EthersPopulatedTransaction,
    connection: EthersConnection,
    attemptedDebtTokenAmount: Decimal,
    redeemableDebtTokenAmount: Decimal,
    increaseAmountByMinimumNetDebt?: (
      maxRedemptionRate?: Decimalish
    ) => Promise<PopulatedEthersRedemption>
  ) {
    const { troveManager } = _getContracts(connection);

    super(
      rawPopulatedTransaction,
      connection,

      ({ logs }) =>
        troveManager
          .extractEvents(logs, "Redemption")
          .map(
            ({
              args: { _FILSent, _FILFee, _actualDebtTokenAmount, _attemptedDebtTokenAmount }
            }) => ({
              attemptedDebtTokenAmount: decimalify(_attemptedDebtTokenAmount),
              actualDebtTokenAmount: decimalify(_actualDebtTokenAmount),
              collateralTaken: decimalify(_FILSent),
              fee: decimalify(_FILFee)
            })
          )[0]
    );

    this.attemptedDebtTokenAmount = attemptedDebtTokenAmount;
    this.redeemableDebtTokenAmount = redeemableDebtTokenAmount;
    this.isTruncated = redeemableDebtTokenAmount.lt(attemptedDebtTokenAmount);
    this._increaseAmountByMinimumNetDebt = increaseAmountByMinimumNetDebt;
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatedRedemptionInterface.increaseAmountByMinimumNetDebt} */
  increaseAmountByMinimumNetDebt(
    maxRedemptionRate?: Decimalish
  ): Promise<PopulatedEthersRedemption> {
    if (!this._increaseAmountByMinimumNetDebt) {
      throw new Error(
        "PopulatedEthersRedemption: increaseAmountByMinimumNetDebt() can " +
          "only be called when amount is truncated"
      );
    }

    return this._increaseAmountByMinimumNetDebt(maxRedemptionRate);
  }
}

/** @internal */
export interface _TroveChangeWithFees<T> {
  params: T;
  newTrove: Trove;
  fee: Decimal;
}

/**
 * Ethers-based implementation of {@link @secured-finance/stablecoin-lib-base#PopulatableProtocol}.
 *
 * @public
 */
export class PopulatableEthers
  implements
    PopulatableProtocol<
      EthersTransactionReceipt,
      EthersTransactionResponse,
      EthersPopulatedTransaction
    >
{
  private readonly _readable: ReadableEthers;

  constructor(readable: ReadableEthers) {
    this._readable = readable;
  }

  private _wrapSimpleTransaction(
    rawPopulatedTransaction: EthersPopulatedTransaction
  ): PopulatedEthersTransaction<void> {
    return new PopulatedEthersTransaction(
      rawPopulatedTransaction,
      this._readable.connection,
      noDetails
    );
  }

  private _wrapTroveChangeWithFees<T>(
    params: T,
    rawPopulatedTransaction: EthersPopulatedTransaction,
    gasHeadroom?: number
  ): PopulatedEthersTransaction<_TroveChangeWithFees<T>> {
    const { borrowerOperations } = _getContracts(this._readable.connection);

    return new PopulatedEthersTransaction(
      rawPopulatedTransaction,
      this._readable.connection,

      ({ logs }) => {
        const [newTrove] = borrowerOperations
          .extractEvents(logs, "TroveUpdated")
          .map(({ args: { _coll, _debt } }) => new Trove(decimalify(_coll), decimalify(_debt)));

        const [fee] = borrowerOperations
          .extractEvents(logs, "DebtTokenBorrowingFeePaid")
          .map(({ args: { _debtTokenFee } }) => decimalify(_debtTokenFee));

        return {
          params,
          newTrove,
          fee
        };
      },

      gasHeadroom
    );
  }

  private async _wrapTroveClosure(
    rawPopulatedTransaction: EthersPopulatedTransaction
  ): Promise<PopulatedEthersTransaction<TroveClosureDetails>> {
    const { activePool, debtToken } = _getContracts(this._readable.connection);

    return new PopulatedEthersTransaction(
      rawPopulatedTransaction,
      this._readable.connection,

      ({ logs, from: userAddress }) => {
        const [repayDebtToken] = debtToken
          .extractEvents(logs, "Transfer")
          .filter(({ args: { from, to } }) => from === userAddress && to === AddressZero)
          .map(({ args: { value } }) => decimalify(value));

        const [withdrawCollateral] = activePool
          .extractEvents(logs, "FILSent")
          .filter(({ args: { _to } }) => _to === userAddress)
          .map(({ args: { _amount } }) => decimalify(_amount));

        return {
          params: repayDebtToken.nonZero
            ? { withdrawCollateral, repayDebtToken }
            : { withdrawCollateral }
        };
      }
    );
  }

  private _wrapLiquidation(
    rawPopulatedTransaction: EthersPopulatedTransaction
  ): PopulatedEthersTransaction<LiquidationDetails> {
    const { troveManager } = _getContracts(this._readable.connection);

    return new PopulatedEthersTransaction(
      rawPopulatedTransaction,
      this._readable.connection,

      ({ logs }) => {
        const liquidatedAddresses = troveManager
          .extractEvents(logs, "TroveLiquidated")
          .map(({ args: { _borrower } }) => _borrower);

        const [totals] = troveManager
          .extractEvents(logs, "Liquidation")
          .map(
            ({
              args: { _debtGasCompensation, _collGasCompensation, _liquidatedColl, _liquidatedDebt }
            }) => ({
              collateralGasCompensation: decimalify(_collGasCompensation),
              debtGasCompensation: decimalify(_debtGasCompensation),
              totalLiquidated: new Trove(decimalify(_liquidatedColl), decimalify(_liquidatedDebt))
            })
          );

        return {
          liquidatedAddresses,
          ...totals
        };
      }
    );
  }

  private _extractStabilityPoolGainsWithdrawalDetails(
    logs: Log[]
  ): StabilityPoolGainsWithdrawalDetails {
    const { stabilityPool } = _getContracts(this._readable.connection);

    const [newDebtTokenDeposit] = stabilityPool
      .extractEvents(logs, "UserDepositChanged")
      .map(({ args: { _newDeposit } }) => decimalify(_newDeposit));

    const [[collateralGain, debtTokenLoss]] = stabilityPool
      .extractEvents(logs, "FILGainWithdrawn")
      .map(({ args: { _FIL, _debtTokenLoss } }) => [decimalify(_FIL), decimalify(_debtTokenLoss)]);

    const [protocolTokenReward] = stabilityPool
      .extractEvents(logs, "ProtocolTokenPaidToDepositor")
      .map(({ args: { _protocolToken } }) => decimalify(_protocolToken));

    return {
      debtTokenLoss,
      newDebtTokenDeposit,
      collateralGain,
      protocolTokenReward
    };
  }

  private _wrapStabilityPoolGainsWithdrawal(
    rawPopulatedTransaction: EthersPopulatedTransaction
  ): PopulatedEthersTransaction<StabilityPoolGainsWithdrawalDetails> {
    return new PopulatedEthersTransaction(
      rawPopulatedTransaction,
      this._readable.connection,
      ({ logs }) => this._extractStabilityPoolGainsWithdrawalDetails(logs)
    );
  }

  private _wrapStabilityDepositTopup(
    change: { depositDebtToken: Decimal },
    rawPopulatedTransaction: EthersPopulatedTransaction
  ): PopulatedEthersTransaction<StabilityDepositChangeDetails> {
    return new PopulatedEthersTransaction(
      rawPopulatedTransaction,
      this._readable.connection,

      ({ logs }) => ({
        ...this._extractStabilityPoolGainsWithdrawalDetails(logs),
        change
      })
    );
  }

  private async _wrapStabilityDepositWithdrawal(
    rawPopulatedTransaction: EthersPopulatedTransaction
  ): Promise<PopulatedEthersTransaction<StabilityDepositChangeDetails>> {
    const { stabilityPool, debtToken } = _getContracts(this._readable.connection);

    return new PopulatedEthersTransaction(
      rawPopulatedTransaction,
      this._readable.connection,

      ({ logs, from: userAddress }) => {
        const gainsWithdrawalDetails = this._extractStabilityPoolGainsWithdrawalDetails(logs);

        const [withdrawDebtToken] = debtToken
          .extractEvents(logs, "Transfer")
          .filter(({ args: { from, to } }) => from === stabilityPool.address && to === userAddress)
          .map(({ args: { value } }) => decimalify(value));

        return {
          ...gainsWithdrawalDetails,
          change: {
            withdrawDebtToken,
            withdrawAllDebtToken: gainsWithdrawalDetails.newDebtTokenDeposit.isZero
          }
        };
      }
    );
  }

  private _wrapCollateralGainTransfer(
    rawPopulatedTransaction: EthersPopulatedTransaction
  ): PopulatedEthersTransaction<CollateralGainTransferDetails> {
    const { borrowerOperations } = _getContracts(this._readable.connection);

    return new PopulatedEthersTransaction(
      rawPopulatedTransaction,
      this._readable.connection,

      ({ logs }) => {
        const [newTrove] = borrowerOperations
          .extractEvents(logs, "TroveUpdated")
          .map(({ args: { _coll, _debt } }) => new Trove(decimalify(_coll), decimalify(_debt)));

        return {
          ...this._extractStabilityPoolGainsWithdrawalDetails(logs),
          newTrove
        };
      }
    );
  }

  private _prepareOverrides(overrides?: EthersTransactionOverrides): EthersTransactionOverrides {
    return { ...overrides, from: _requireAddress(this._readable.connection, overrides) };
  }

  private async _findHints(trove: Trove, ownAddress?: string): Promise<[string, string]> {
    if (trove instanceof TroveWithPendingRedistribution) {
      throw new Error("Rewards must be applied to this Trove");
    }

    return this._readable.findHintsForNominalCollateralRatio(
      trove._nominalCollateralRatio,
      ownAddress
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.openTrove} */
  async openTrove(
    params: TroveCreationParams<Decimalish>,
    maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<TroveCreationDetails>> {
    overrides = this._prepareOverrides(overrides);
    const { borrowerOperations } = _getContracts(this._readable.connection);

    const normalizedParams = _normalizeTroveCreation(params);
    const { depositCollateral, borrowDebtToken } = normalizedParams;

    const [fees, blockTimestamp, total, price] = await Promise.all([
      this._readable._getFeesFactory(),
      this._readable._getBlockTimestamp(),
      this._readable.getTotal(),
      this._readable.getPrice()
    ]);

    const recoveryMode = total.collateralRatioIsBelowCritical(price);

    const decayBorrowingRate = (seconds: number) =>
      fees(blockTimestamp + seconds, recoveryMode).borrowingRate();

    const currentBorrowingRate = decayBorrowingRate(0);
    const newTrove = Trove.create(normalizedParams, currentBorrowingRate);
    const hints = await this._findHints(newTrove);

    const { maxBorrowingRate, borrowingFeeDecayToleranceMinutes } =
      normalizeBorrowingOperationOptionalParams(
        maxBorrowingRateOrOptionalParams,
        currentBorrowingRate
      );

    const txParams = (borrowDebtToken: Decimal): Parameters<typeof borrowerOperations.openTrove> => [
      maxBorrowingRate.hex,
      borrowDebtToken.hex,
      ...hints,
      { value: depositCollateral.hex, ...overrides }
    ];

    let gasHeadroom: number | undefined;

    if (overrides?.gasLimit === undefined) {
      const decayedBorrowingRate = decayBorrowingRate(60 * borrowingFeeDecayToleranceMinutes);
      const decayedTrove = Trove.create(normalizedParams, decayedBorrowingRate);
      const { borrowDebtToken: borrowDebtTokenSimulatingDecay } = Trove.recreate(
        decayedTrove,
        currentBorrowingRate
      );

      if (decayedTrove.debt.lt(MINIMUM_DEBT)) {
        throw new Error(
          `Trove's debt might fall below ${MINIMUM_DEBT} ` +
            `within ${borrowingFeeDecayToleranceMinutes} minutes`
        );
      }

      const [gasNow, gasLater] = await Promise.all([
        borrowerOperations.estimateGas.openTrove(...txParams(borrowDebtToken)),
        borrowerOperations.estimateGas.openTrove(...txParams(borrowDebtTokenSimulatingDecay))
      ]);

      const gasLimit = addGasForBaseRateUpdate(borrowingFeeDecayToleranceMinutes)(
        bigNumberMax(addGasForPotentialListTraversal(gasNow), gasLater)
      );

      gasHeadroom = gasLimit.sub(gasNow).toNumber();
      overrides = { ...overrides, gasLimit };
    }

    return this._wrapTroveChangeWithFees(
      normalizedParams,
      await borrowerOperations.populateTransaction.openTrove(...txParams(borrowDebtToken)),
      gasHeadroom
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.closeTrove} */
  async closeTrove(
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<TroveClosureDetails>> {
    overrides = this._prepareOverrides(overrides);
    const { borrowerOperations } = _getContracts(this._readable.connection);

    return this._wrapTroveClosure(
      await borrowerOperations.estimateAndPopulate.closeTrove(overrides, id)
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.depositCollateral} */
  depositCollateral(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<TroveAdjustmentDetails>> {
    return this.adjustTrove({ depositCollateral: amount }, undefined, overrides);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.withdrawCollateral} */
  withdrawCollateral(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<TroveAdjustmentDetails>> {
    return this.adjustTrove({ withdrawCollateral: amount }, undefined, overrides);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.borrowDebtToken} */
  borrowDebtToken(
    amount: Decimalish,
    maxBorrowingRate?: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<TroveAdjustmentDetails>> {
    return this.adjustTrove({ borrowDebtToken: amount }, maxBorrowingRate, overrides);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.repayDebtToken} */
  repayDebtToken(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<TroveAdjustmentDetails>> {
    return this.adjustTrove({ repayDebtToken: amount }, undefined, overrides);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.adjustTrove} */
  async adjustTrove(
    params: TroveAdjustmentParams<Decimalish>,
    maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<TroveAdjustmentDetails>> {
    overrides = this._prepareOverrides(overrides);
    const { borrowerOperations } = _getContracts(this._readable.connection);

    const normalizedParams = _normalizeTroveAdjustment(params);
    const { depositCollateral, withdrawCollateral, borrowDebtToken, repayDebtToken } =
      normalizedParams;

    const [trove, feeVars] = await Promise.all([
      this._readable.getTrove(overrides.from),
      borrowDebtToken &&
        promiseAllValues({
          fees: this._readable._getFeesFactory(),
          blockTimestamp: this._readable._getBlockTimestamp(),
          total: this._readable.getTotal(),
          price: this._readable.getPrice()
        })
    ]);

    const decayBorrowingRate = (seconds: number) =>
      feeVars
        ?.fees(
          feeVars.blockTimestamp + seconds,
          feeVars.total.collateralRatioIsBelowCritical(feeVars.price)
        )
        .borrowingRate();

    const currentBorrowingRate = decayBorrowingRate(0);
    const adjustedTrove = trove.adjust(normalizedParams, currentBorrowingRate);
    const hints = await this._findHints(adjustedTrove, overrides.from);

    const { maxBorrowingRate, borrowingFeeDecayToleranceMinutes } =
      normalizeBorrowingOperationOptionalParams(
        maxBorrowingRateOrOptionalParams,
        currentBorrowingRate
      );

    const txParams = (
      borrowDebtToken?: Decimal
    ): Parameters<typeof borrowerOperations.adjustTrove> => [
      maxBorrowingRate.hex,
      (withdrawCollateral ?? Decimal.ZERO).hex,
      (borrowDebtToken ?? repayDebtToken ?? Decimal.ZERO).hex,
      !!borrowDebtToken,
      ...hints,
      { value: depositCollateral?.hex, ...overrides }
    ];

    let gasHeadroom: number | undefined;

    if (overrides.gasLimit === undefined) {
      const decayedBorrowingRate = decayBorrowingRate(60 * borrowingFeeDecayToleranceMinutes);
      const decayedTrove = trove.adjust(normalizedParams, decayedBorrowingRate);
      const { borrowDebtToken: borrowDebtTokenSimulatingDecay } = trove.adjustTo(
        decayedTrove,
        currentBorrowingRate
      );

      if (decayedTrove.debt.lt(MINIMUM_DEBT)) {
        throw new Error(
          `Trove's debt might fall below ${MINIMUM_DEBT} ` +
            `within ${borrowingFeeDecayToleranceMinutes} minutes`
        );
      }

      const [gasNow, gasLater] = await Promise.all([
        borrowerOperations.estimateGas.adjustTrove(...txParams(borrowDebtToken)),
        borrowDebtToken &&
          borrowerOperations.estimateGas.adjustTrove(...txParams(borrowDebtTokenSimulatingDecay))
      ]);

      let gasLimit = bigNumberMax(addGasForPotentialListTraversal(gasNow), gasLater);

      if (borrowDebtToken) {
        gasLimit = addGasForBaseRateUpdate(borrowingFeeDecayToleranceMinutes)(gasLimit);
      }

      gasHeadroom = gasLimit.sub(gasNow).toNumber();
      overrides = { ...overrides, gasLimit };
    }

    return this._wrapTroveChangeWithFees(
      normalizedParams,
      await borrowerOperations.populateTransaction.adjustTrove(...txParams(borrowDebtToken)),
      gasHeadroom
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.claimCollateralSurplus} */
  async claimCollateralSurplus(
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<void>> {
    overrides = this._prepareOverrides(overrides);
    const { borrowerOperations } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await borrowerOperations.estimateAndPopulate.claimCollateral(overrides, id)
    );
  }

  /** @internal */
  async setPrice(
    price: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<void>> {
    overrides = this._prepareOverrides(overrides);
    const { priceFeed } = _getContracts(this._readable.connection);

    if (!_priceFeedIsTestnet(priceFeed)) {
      throw new Error("setPrice() unavailable on this deployment of the protocol");
    }

    return this._wrapSimpleTransaction(
      await priceFeed.estimateAndPopulate.setPrice(overrides, id, Decimal.from(price).hex)
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.liquidate} */
  async liquidate(
    address: string | string[],
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<LiquidationDetails>> {
    overrides = this._prepareOverrides(overrides);
    const { troveManager } = _getContracts(this._readable.connection);

    if (Array.isArray(address)) {
      return this._wrapLiquidation(
        await troveManager.estimateAndPopulate.batchLiquidateTroves(
          overrides,
          addGasForProtocolTokenIssuance,
          address
        )
      );
    } else {
      return this._wrapLiquidation(
        await troveManager.estimateAndPopulate.liquidate(
          overrides,
          addGasForProtocolTokenIssuance,
          address
        )
      );
    }
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.liquidateUpTo} */
  async liquidateUpTo(
    maximumNumberOfTrovesToLiquidate: number,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<LiquidationDetails>> {
    overrides = this._prepareOverrides(overrides);
    const { troveManager } = _getContracts(this._readable.connection);

    return this._wrapLiquidation(
      await troveManager.estimateAndPopulate.liquidateTroves(
        overrides,
        addGasForProtocolTokenIssuance,
        maximumNumberOfTrovesToLiquidate
      )
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.depositDebtTokenInStabilityPool} */
  async depositDebtTokenInStabilityPool(
    amount: Decimalish,
    frontendTag?: string,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<StabilityDepositChangeDetails>> {
    overrides = this._prepareOverrides(overrides);
    const { stabilityPool } = _getContracts(this._readable.connection);
    const depositDebtToken = Decimal.from(amount);

    return this._wrapStabilityDepositTopup(
      { depositDebtToken },
      await stabilityPool.estimateAndPopulate.provideToSP(
        overrides,
        addGasForProtocolTokenIssuance,
        depositDebtToken.hex,
        frontendTag ?? this._readable.connection.frontendTag ?? AddressZero
      )
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.withdrawDebtTokenFromStabilityPool} */
  async withdrawDebtTokenFromStabilityPool(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<StabilityDepositChangeDetails>> {
    overrides = this._prepareOverrides(overrides);
    const { stabilityPool } = _getContracts(this._readable.connection);

    return this._wrapStabilityDepositWithdrawal(
      await stabilityPool.estimateAndPopulate.withdrawFromSP(
        overrides,
        addGasForProtocolTokenIssuance,
        Decimal.from(amount).hex
      )
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.withdrawGainsFromStabilityPool} */
  async withdrawGainsFromStabilityPool(
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<StabilityPoolGainsWithdrawalDetails>> {
    overrides = this._prepareOverrides(overrides);
    const { stabilityPool } = _getContracts(this._readable.connection);

    return this._wrapStabilityPoolGainsWithdrawal(
      await stabilityPool.estimateAndPopulate.withdrawFromSP(
        overrides,
        addGasForProtocolTokenIssuance,
        Decimal.ZERO.hex
      )
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.transferCollateralGainToTrove} */
  async transferCollateralGainToTrove(
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<CollateralGainTransferDetails>> {
    overrides = this._prepareOverrides(overrides);
    const { stabilityPool } = _getContracts(this._readable.connection);

    const [initialTrove, stabilityDeposit] = await Promise.all([
      this._readable.getTrove(overrides.from),
      this._readable.getStabilityDeposit(overrides.from)
    ]);

    const finalTrove = initialTrove.addCollateral(stabilityDeposit.collateralGain);

    return this._wrapCollateralGainTransfer(
      await stabilityPool.estimateAndPopulate.withdrawFILGainToTrove(
        overrides,
        compose(addGasForPotentialListTraversal, addGasForProtocolTokenIssuance),
        ...(await this._findHints(finalTrove, overrides.from))
      )
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.sendDebtToken} */
  async sendDebtToken(
    toAddress: string,
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<void>> {
    overrides = this._prepareOverrides(overrides);
    const { debtToken } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await debtToken.estimateAndPopulate.transfer(
        overrides,
        id,
        toAddress,
        Decimal.from(amount).hex
      )
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.sendProtocolToken} */
  async sendProtocolToken(
    toAddress: string,
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<void>> {
    overrides = this._prepareOverrides(overrides);
    const { protocolToken } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await protocolToken.estimateAndPopulate.transfer(
        overrides,
        id,
        toAddress,
        Decimal.from(amount).hex
      )
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.redeemDebtToken} */
  async redeemDebtToken(
    amount: Decimalish,
    maxRedemptionRate?: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersRedemption> {
    const preparedOverrides = this._prepareOverrides(overrides);
    const { troveManager } = _getContracts(this._readable.connection);
    const attemptedDebtTokenAmount = Decimal.from(amount);

    const [fees, total, [truncatedAmount, firstRedemptionHint, ...partialHints]] = await Promise.all(
      [
        this._readable.getFees(),
        this._readable.getTotal(),
        this._readable.findRedemptionHints(attemptedDebtTokenAmount)
      ]
    );

    if (truncatedAmount.isZero) {
      throw new Error(
        `redeemDebtToken: amount too low to redeem (try at least ${MINIMUM_NET_DEBT})`
      );
    }

    const defaultMaxRedemptionRate = (amount: Decimal) =>
      Decimal.min(
        fees.redemptionRate(amount.div(total.debt)).add(defaultRedemptionRateSlippageTolerance),
        Decimal.ONE
      );

    const populateRedemption = async (
      attemptedDebtTokenAmount: Decimal,
      maxRedemptionRate?: Decimalish,
      truncatedAmount: Decimal = attemptedDebtTokenAmount,
      partialHints: [string, string, BigNumberish] = [AddressZero, AddressZero, 0]
    ): Promise<PopulatedEthersRedemption> => {
      const maxRedemptionRateOrDefault =
        maxRedemptionRate !== undefined
          ? Decimal.from(maxRedemptionRate)
          : defaultMaxRedemptionRate(truncatedAmount);

      return new PopulatedEthersRedemption(
        await troveManager.estimateAndPopulate.redeemCollateral(
          preparedOverrides,
          addGasForBaseRateUpdate(),
          truncatedAmount.hex,
          firstRedemptionHint,
          ...partialHints,
          redeemMaxIterations,
          maxRedemptionRateOrDefault.hex
        ),

        this._readable.connection,
        attemptedDebtTokenAmount,
        truncatedAmount,

        truncatedAmount.lt(attemptedDebtTokenAmount)
          ? newMaxRedemptionRate =>
              populateRedemption(
                truncatedAmount.add(MINIMUM_NET_DEBT),
                newMaxRedemptionRate ?? maxRedemptionRate
              )
          : undefined
      );
    };

    return populateRedemption(
      attemptedDebtTokenAmount,
      maxRedemptionRate,
      truncatedAmount,
      partialHints
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.stakeProtocolToken} */
  async stakeProtocolToken(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<void>> {
    overrides = this._prepareOverrides(overrides);
    const { protocolTokenStaking } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await protocolTokenStaking.estimateAndPopulate.stake(overrides, id, Decimal.from(amount).hex)
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.unstakeProtocolToken} */
  async unstakeProtocolToken(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<void>> {
    overrides = this._prepareOverrides(overrides);
    const { protocolTokenStaking } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await protocolTokenStaking.estimateAndPopulate.unstake(overrides, id, Decimal.from(amount).hex)
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.withdrawGainsFromStaking} */
  withdrawGainsFromStaking(
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<void>> {
    return this.unstakeProtocolToken(Decimal.ZERO, overrides);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.registerFrontend} */
  async registerFrontend(
    kickbackRate: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<void>> {
    overrides = this._prepareOverrides(overrides);
    const { stabilityPool } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await stabilityPool.estimateAndPopulate.registerFrontEnd(
        overrides,
        id,
        Decimal.from(kickbackRate).hex
      )
    );
  }

  /** @internal */
  async _mintUniToken(
    amount: Decimalish,
    address?: string,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<void>> {
    address ??= _requireAddress(this._readable.connection, overrides);
    overrides = this._prepareOverrides(overrides);
    const { uniToken } = _getContracts(this._readable.connection);

    if (!_uniTokenIsMock(uniToken)) {
      throw new Error("_mintUniToken() unavailable on this deployment of the protocol");
    }

    return this._wrapSimpleTransaction(
      await uniToken.estimateAndPopulate.mint(overrides, id, address, Decimal.from(amount).hex)
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.approveUniTokens} */
  async approveUniTokens(
    allowance?: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<void>> {
    overrides = this._prepareOverrides(overrides);
    const { uniToken, unipool } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await uniToken.estimateAndPopulate.approve(
        overrides,
        id,
        unipool.address,
        Decimal.from(allowance ?? Decimal.INFINITY).hex
      )
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.stakeUniTokens} */
  async stakeUniTokens(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<void>> {
    overrides = this._prepareOverrides(overrides);
    const { unipool } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await unipool.estimateAndPopulate.stake(
        overrides,
        addGasForUnipoolRewardUpdate,
        Decimal.from(amount).hex
      )
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.unstakeUniTokens} */
  async unstakeUniTokens(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<void>> {
    overrides = this._prepareOverrides(overrides);
    const { unipool } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await unipool.estimateAndPopulate.withdraw(
        overrides,
        addGasForUnipoolRewardUpdate,
        Decimal.from(amount).hex
      )
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.withdrawProtocolTokenRewardFromProtocolMining} */
  async withdrawProtocolTokenRewardFromProtocolMining(
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<void>> {
    overrides = this._prepareOverrides(overrides);
    const { unipool } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await unipool.estimateAndPopulate.claimReward(overrides, addGasForUnipoolRewardUpdate)
    );
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#PopulatableProtocol.exitLiquidityMining} */
  async exitLiquidityMining(
    overrides?: EthersTransactionOverrides
  ): Promise<PopulatedEthersTransaction<void>> {
    overrides = this._prepareOverrides(overrides);
    const { unipool } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await unipool.estimateAndPopulate.withdrawAndClaim(overrides, addGasForUnipoolRewardUpdate)
    );
  }
}
