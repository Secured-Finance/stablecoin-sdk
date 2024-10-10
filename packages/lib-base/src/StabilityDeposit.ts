import { Decimal, Decimalish } from "./Decimal";

/**
 * Represents the change between two Stability Deposit states.
 *
 * @public
 */
export type StabilityDepositChange<T> =
  | { depositDebtToken: T; withdrawDebtToken?: undefined }
  | { depositDebtToken?: undefined; withdrawDebtToken: T; withdrawAllDebtToken: boolean };

/**
 * A Stability Deposit and its accrued gains.
 *
 * @public
 */
export class StabilityDeposit {
  /** Amount of DebtToken in the Stability Deposit at the time of the last direct modification. */
  readonly initialDebtToken: Decimal;

  /** Amount of DebtToken left in the Stability Deposit. */
  readonly currentDebtToken: Decimal;

  /** Amount of native currency (e.g. Ether) received in exchange for the used-up DebtToken. */
  readonly collateralGain: Decimal;

  /** Amount of LQTY rewarded since the last modification of the Stability Deposit. */
  readonly lqtyReward: Decimal;

  /**
   * Address of frontend through which this Stability Deposit was made.
   *
   * @remarks
   * If the Stability Deposit was made through a frontend that doesn't tag deposits, this will be
   * the zero-address.
   */
  readonly frontendTag: string;

  /** @internal */
  constructor(
    initialDebtToken: Decimal,
    currentDebtToken: Decimal,
    collateralGain: Decimal,
    lqtyReward: Decimal,
    frontendTag: string
  ) {
    this.initialDebtToken = initialDebtToken;
    this.currentDebtToken = currentDebtToken;
    this.collateralGain = collateralGain;
    this.lqtyReward = lqtyReward;
    this.frontendTag = frontendTag;

    if (this.currentDebtToken.gt(this.initialDebtToken)) {
      throw new Error("currentDebtToken can't be greater than initialDebtToken");
    }
  }

  get isEmpty(): boolean {
    return (
      this.initialDebtToken.isZero &&
      this.currentDebtToken.isZero &&
      this.collateralGain.isZero &&
      this.lqtyReward.isZero
    );
  }

  /** @internal */
  toString(): string {
    return (
      `{ initialDebtToken: ${this.initialDebtToken}` +
      `, currentDebtToken: ${this.currentDebtToken}` +
      `, collateralGain: ${this.collateralGain}` +
      `, lqtyReward: ${this.lqtyReward}` +
      `, frontendTag: "${this.frontendTag}" }`
    );
  }

  /**
   * Compare to another instance of `StabilityDeposit`.
   */
  equals(that: StabilityDeposit): boolean {
    return (
      this.initialDebtToken.eq(that.initialDebtToken) &&
      this.currentDebtToken.eq(that.currentDebtToken) &&
      this.collateralGain.eq(that.collateralGain) &&
      this.lqtyReward.eq(that.lqtyReward) &&
      this.frontendTag === that.frontendTag
    );
  }

  /**
   * Calculate the difference between the `currentDebtToken` in this Stability Deposit and `thatDebtToken`.
   *
   * @returns An object representing the change, or `undefined` if the deposited amounts are equal.
   */
  whatChanged(thatDebtToken: Decimalish): StabilityDepositChange<Decimal> | undefined {
    thatDebtToken = Decimal.from(thatDebtToken);

    if (thatDebtToken.lt(this.currentDebtToken)) {
      return {
        withdrawDebtToken: this.currentDebtToken.sub(thatDebtToken),
        withdrawAllDebtToken: thatDebtToken.isZero
      };
    }

    if (thatDebtToken.gt(this.currentDebtToken)) {
      return { depositDebtToken: thatDebtToken.sub(this.currentDebtToken) };
    }
  }

  /**
   * Apply a {@link StabilityDepositChange} to this Stability Deposit.
   *
   * @returns The new deposited DebtToken amount.
   */
  apply(change: StabilityDepositChange<Decimalish> | undefined): Decimal {
    if (!change) {
      return this.currentDebtToken;
    }

    if (change.withdrawDebtToken !== undefined) {
      return change.withdrawAllDebtToken || this.currentDebtToken.lte(change.withdrawDebtToken)
        ? Decimal.ZERO
        : this.currentDebtToken.sub(change.withdrawDebtToken);
    } else {
      return this.currentDebtToken.add(change.depositDebtToken);
    }
  }
}
