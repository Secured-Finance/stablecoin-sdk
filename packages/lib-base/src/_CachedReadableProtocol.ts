import { BigNumber } from "@ethersproject/bignumber";
import { Decimal, Decimalish } from "./Decimal";
import { Fees } from "./Fees";
import { ProtocolTokenStake } from "./ProtocolTokenStake";
import { FrontendStatus, ReadableProtocol, TroveListingParams } from "./ReadableProtocol";
import { StabilityDeposit } from "./StabilityDeposit";
import { Trove, TroveWithPendingRedistribution, UserTrove } from "./Trove";

/** @internal */
export type _ReadableProtocolWithExtraParamsBase<T extends unknown[]> = {
  [P in keyof ReadableProtocol]: ReadableProtocol[P] extends (...params: infer A) => infer R
    ? (...params: [...originalParams: A, ...extraParams: T]) => R
    : never;
};

/** @internal */
export type _ProtocolReadCacheBase<T extends unknown[]> = {
  [P in keyof ReadableProtocol]: ReadableProtocol[P] extends (...args: infer A) => Promise<infer R>
    ? (...params: [...originalParams: A, ...extraParams: T]) => R | undefined
    : never;
};

// Overloads get lost in the mapping, so we need to define them again...

/** @internal */
export interface _ReadableProtocolWithExtraParams<T extends unknown[]>
  extends _ReadableProtocolWithExtraParamsBase<T> {
  getTroves(
    params: TroveListingParams & { beforeRedistribution: true },
    ...extraParams: T
  ): Promise<TroveWithPendingRedistribution[]>;

  getTroves(params: TroveListingParams, ...extraParams: T): Promise<UserTrove[]>;
}

/** @internal */
export interface _ProtocolReadCache<T extends unknown[]> extends _ProtocolReadCacheBase<T> {
  getTroves(
    params: TroveListingParams & { beforeRedistribution: true },
    ...extraParams: T
  ): TroveWithPendingRedistribution[] | undefined;

  getTroves(params: TroveListingParams, ...extraParams: T): UserTrove[] | undefined;
}

/** @internal */
export class _CachedReadableProtocol<T extends unknown[]>
  implements _ReadableProtocolWithExtraParams<T>
{
  private _readable: _ReadableProtocolWithExtraParams<T>;
  private _cache: _ProtocolReadCache<T>;

  constructor(readable: _ReadableProtocolWithExtraParams<T>, cache: _ProtocolReadCache<T>) {
    this._readable = readable;
    this._cache = cache;
  }

  async getTotalRedistributed(...extraParams: T): Promise<Trove> {
    return (
      this._cache.getTotalRedistributed(...extraParams) ??
      this._readable.getTotalRedistributed(...extraParams)
    );
  }

  async getTroveBeforeRedistribution(
    address?: string,
    ...extraParams: T
  ): Promise<TroveWithPendingRedistribution> {
    return (
      this._cache.getTroveBeforeRedistribution(address, ...extraParams) ??
      this._readable.getTroveBeforeRedistribution(address, ...extraParams)
    );
  }

  async getTrove(address?: string, ...extraParams: T): Promise<UserTrove> {
    const [troveBeforeRedistribution, totalRedistributed] = await Promise.all([
      this.getTroveBeforeRedistribution(address, ...extraParams),
      this.getTotalRedistributed(...extraParams)
    ]);

    return troveBeforeRedistribution.applyRedistribution(totalRedistributed);
  }

  async getNumberOfTroves(...extraParams: T): Promise<number> {
    return (
      this._cache.getNumberOfTroves(...extraParams) ??
      this._readable.getNumberOfTroves(...extraParams)
    );
  }

  async getPrice(...extraParams: T): Promise<Decimal> {
    return this._cache.getPrice(...extraParams) ?? this._readable.getPrice(...extraParams);
  }

  async getTotal(...extraParams: T): Promise<Trove> {
    return this._cache.getTotal(...extraParams) ?? this._readable.getTotal(...extraParams);
  }

  async getStabilityDeposit(address?: string, ...extraParams: T): Promise<StabilityDeposit> {
    return (
      this._cache.getStabilityDeposit(address, ...extraParams) ??
      this._readable.getStabilityDeposit(address, ...extraParams)
    );
  }

  async getRemainingStabilityPoolProtocolTokenReward(...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getRemainingStabilityPoolProtocolTokenReward(...extraParams) ??
      this._readable.getRemainingStabilityPoolProtocolTokenReward(...extraParams)
    );
  }

  async getDebtTokenInStabilityPool(...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getDebtTokenInStabilityPool(...extraParams) ??
      this._readable.getDebtTokenInStabilityPool(...extraParams)
    );
  }

  async getDebtTokenBalance(address?: string, ...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getDebtTokenBalance(address, ...extraParams) ??
      this._readable.getDebtTokenBalance(address, ...extraParams)
    );
  }

  async getProtocolTokenBalance(address?: string, ...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getProtocolTokenBalance(address, ...extraParams) ??
      this._readable.getProtocolTokenBalance(address, ...extraParams)
    );
  }

  async getUniTokenBalance(address?: string, ...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getUniTokenBalance(address, ...extraParams) ??
      this._readable.getUniTokenBalance(address, ...extraParams)
    );
  }

  async getUniTokenAllowance(address?: string, ...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getUniTokenAllowance(address, ...extraParams) ??
      this._readable.getUniTokenAllowance(address, ...extraParams)
    );
  }

  async getRemainingProtocolMiningProtocolTokenReward(...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getRemainingProtocolMiningProtocolTokenReward(...extraParams) ??
      this._readable.getRemainingProtocolMiningProtocolTokenReward(...extraParams)
    );
  }

  async getLiquidityMiningStake(address?: string, ...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getLiquidityMiningStake(address, ...extraParams) ??
      this._readable.getLiquidityMiningStake(address, ...extraParams)
    );
  }

  async getTotalStakedUniTokens(...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getTotalStakedUniTokens(...extraParams) ??
      this._readable.getTotalStakedUniTokens(...extraParams)
    );
  }

  async getLiquidityMiningProtocolTokenReward(
    address?: string,
    ...extraParams: T
  ): Promise<Decimal> {
    return (
      this._cache.getLiquidityMiningProtocolTokenReward(address, ...extraParams) ??
      this._readable.getLiquidityMiningProtocolTokenReward(address, ...extraParams)
    );
  }

  async getCollateralSurplusBalance(address?: string, ...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getCollateralSurplusBalance(address, ...extraParams) ??
      this._readable.getCollateralSurplusBalance(address, ...extraParams)
    );
  }

  getTroves(
    params: TroveListingParams & { beforeRedistribution: true },
    ...extraParams: T
  ): Promise<TroveWithPendingRedistribution[]>;

  getTroves(params: TroveListingParams, ...extraParams: T): Promise<UserTrove[]>;

  async getTroves(params: TroveListingParams, ...extraParams: T): Promise<UserTrove[]> {
    const { beforeRedistribution, ...restOfParams } = params;

    const [totalRedistributed, troves] = await Promise.all([
      beforeRedistribution ? undefined : this.getTotalRedistributed(...extraParams),
      this._cache.getTroves({ beforeRedistribution: true, ...restOfParams }, ...extraParams) ??
        this._readable.getTroves({ beforeRedistribution: true, ...restOfParams }, ...extraParams)
    ]);

    if (totalRedistributed) {
      return troves.map(trove => trove.applyRedistribution(totalRedistributed));
    } else {
      return troves;
    }
  }

  async getFees(...extraParams: T): Promise<Fees> {
    return this._cache.getFees(...extraParams) ?? this._readable.getFees(...extraParams);
  }

  async getProtocolTokenStake(address?: string, ...extraParams: T): Promise<ProtocolTokenStake> {
    return (
      this._cache.getProtocolTokenStake(address, ...extraParams) ??
      this._readable.getProtocolTokenStake(address, ...extraParams)
    );
  }

  async getTotalStakedProtocolToken(...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getTotalStakedProtocolToken(...extraParams) ??
      this._readable.getTotalStakedProtocolToken(...extraParams)
    );
  }

  async getFrontendStatus(address?: string, ...extraParams: T): Promise<FrontendStatus> {
    return (
      this._cache.getFrontendStatus(address, ...extraParams) ??
      this._readable.getFrontendStatus(address, ...extraParams)
    );
  }

  async findHintsForNominalCollateralRatio(
    nominalCollateralRatio: Decimalish,
    ...extraParams: T
  ): Promise<[firstHint: string, secondHint: string]> {
    return (
      this._cache.findHintsForNominalCollateralRatio(nominalCollateralRatio, ...extraParams) ??
      this._readable.findHintsForNominalCollateralRatio(nominalCollateralRatio, ...extraParams)
    );
  }

  async findRedemptionHints(
    amount: Decimalish,
    ...extraParams: T
  ): Promise<
    [
      truncatedAmount: Decimal,
      firstRedemptionHint: string,
      partialRedemptionUpperHint: string,
      partialRedemptionLowerHint: string,
      partialRedemptionHintNICR: BigNumber
    ]
  > {
    return (
      this._cache.findRedemptionHints(amount, ...extraParams) ??
      this._readable.findRedemptionHints(amount, ...extraParams)
    );
  }
}
