import { Decimal, Decimalish } from "./Decimal";

/**
 * Represents the change between two states of an ProtocolToken Stake.
 *
 * @public
 */
export type ProtocolTokenStakeChange<T> =
  | { stakeProtocolToken: T; unstakeProtocolToken?: undefined }
  | { stakeProtocolToken?: undefined; unstakeProtocolToken: T; unstakeAllProtocolToken: boolean };

/** 
 * Represents a user's ProtocolToken stake and accrued gains.
 * 
 * @remarks
 * Returned by the {@link ReadableProtocol.getProtocolTokenStake | getProtocolTokenStake()} function.

 * @public
 */
export class ProtocolTokenStake {
  /** The amount of ProtocolToken that's staked. */
  readonly stakedProtocolToken: Decimal;

  /** Collateral gain available to withdraw. */
  readonly collateralGain: Decimal;

  /** Debt token gain available to withdraw. */
  readonly debtTokenGain: Decimal;

  /** @internal */
  constructor(
    stakedProtocolToken = Decimal.ZERO,
    collateralGain = Decimal.ZERO,
    debtTokenGain = Decimal.ZERO
  ) {
    this.stakedProtocolToken = stakedProtocolToken;
    this.collateralGain = collateralGain;
    this.debtTokenGain = debtTokenGain;
  }

  get isEmpty(): boolean {
    return (
      this.stakedProtocolToken.isZero && this.collateralGain.isZero && this.debtTokenGain.isZero
    );
  }

  /** @internal */
  toString(): string {
    return (
      `{ stakedProtocolToken: ${this.stakedProtocolToken}` +
      `, collateralGain: ${this.collateralGain}` +
      `, debtTokenGain: ${this.debtTokenGain} }`
    );
  }

  /**
   * Compare to another instance of `ProtocolTokenStake`.
   */
  equals(that: ProtocolTokenStake): boolean {
    return (
      this.stakedProtocolToken.eq(that.stakedProtocolToken) &&
      this.collateralGain.eq(that.collateralGain) &&
      this.debtTokenGain.eq(that.debtTokenGain)
    );
  }

  /**
   * Calculate the difference between this `ProtocolTokenStake` and `thatStakedProtocolToken`.
   *
   * @returns An object representing the change, or `undefined` if the staked amounts are equal.
   */
  whatChanged(thatStakedProtocolToken: Decimalish): ProtocolTokenStakeChange<Decimal> | undefined {
    thatStakedProtocolToken = Decimal.from(thatStakedProtocolToken);

    if (thatStakedProtocolToken.lt(this.stakedProtocolToken)) {
      return {
        unstakeProtocolToken: this.stakedProtocolToken.sub(thatStakedProtocolToken),
        unstakeAllProtocolToken: thatStakedProtocolToken.isZero
      };
    }

    if (thatStakedProtocolToken.gt(this.stakedProtocolToken)) {
      return { stakeProtocolToken: thatStakedProtocolToken.sub(this.stakedProtocolToken) };
    }
  }

  /**
   * Apply a {@link ProtocolTokenStakeChange} to this `ProtocolTokenStake`.
   *
   * @returns The new staked ProtocolToken amount.
   */
  apply(change: ProtocolTokenStakeChange<Decimalish> | undefined): Decimal {
    if (!change) {
      return this.stakedProtocolToken;
    }

    if (change.unstakeProtocolToken !== undefined) {
      return change.unstakeAllProtocolToken ||
        this.stakedProtocolToken.lte(change.unstakeProtocolToken)
        ? Decimal.ZERO
        : this.stakedProtocolToken.sub(change.unstakeProtocolToken);
    } else {
      return this.stakedProtocolToken.add(change.stakeProtocolToken);
    }
  }
}
