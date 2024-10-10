import { Decimal } from "./Decimal";
import { StabilityDeposit } from "./StabilityDeposit";
import { Trove, TroveWithPendingRedistribution } from "./Trove";

/** @alpha */
export interface ObservableLiquity {
  watchTotalRedistributed(
    onTotalRedistributedChanged: (totalRedistributed: Trove) => void
  ): () => void;

  watchTroveWithoutRewards(
    onTroveChanged: (trove: TroveWithPendingRedistribution) => void,
    address?: string
  ): () => void;

  watchNumberOfTroves(onNumberOfTrovesChanged: (numberOfTroves: number) => void): () => void;

  watchPrice(onPriceChanged: (price: Decimal) => void): () => void;

  watchTotal(onTotalChanged: (total: Trove) => void): () => void;

  watchStabilityDeposit(
    onStabilityDepositChanged: (stabilityDeposit: StabilityDeposit) => void,
    address?: string
  ): () => void;

  watchDebtTokenInStabilityPool(
    onDebtTokenInStabilityPoolChanged: (debtTokenInStabilityPool: Decimal) => void
  ): () => void;

  watchDebtTokenBalance(
    onDebtTokenBalanceChanged: (balance: Decimal) => void,
    address?: string
  ): () => void;
}
