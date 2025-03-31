import { ApolloClient, gql, HttpLink, InMemoryCache, NormalizedCacheObject } from "@apollo/client";
import { getAddress } from "@ethersproject/address";
import fetch from "cross-fetch";

import {
  _emptyTrove,
  Decimal,
  Decimalish,
  Fees,
  FrontendStatus,
  ObservableProtocol,
  ProtocolTokenStake,
  ReadableProtocol,
  StabilityDeposit,
  Trove,
  TroveListingParams,
  TroveWithPendingRedistribution,
  UserTrove
} from "@secured-finance/stablecoin-lib-base";

import { BlockNumberDummy, BlockNumberDummyVariables } from "../types/BlockNumberDummy";
import { Global } from "../types/Global";
import { OrderDirection } from "../types/globalTypes";
import { TroveRawFields } from "../types/TroveRawFields";
import { Troves, TrovesVariables } from "../types/Troves";
import { TroveWithoutRewards, TroveWithoutRewardsVariables } from "../types/TroveWithoutRewards";

import { BigNumber } from "@ethersproject/bignumber";
import { Query } from "./Query";

const normalizeAddress = (address?: string) => {
  if (address === undefined) {
    throw new Error("An address is required");
  }

  return address.toLowerCase();
};

const decimalify = (bigNumberString: string) => Decimal.fromBigNumberString(bigNumberString);

const queryGlobal = gql`
  query Global {
    global(id: "only") {
      id
      numberOfOpenTroves
      rawTotalRedistributedCollateral
      rawTotalRedistributedDebt

      currentSystemState {
        id
        price
        totalCollateral
        totalDebt
        tokensInStabilityPool
      }
    }
  }
`;

const numberOfTroves = new Query<number, Global>(
  queryGlobal,
  ({ data: { global } }) => global?.numberOfOpenTroves ?? 0
);

const totalRedistributed = new Query<Trove, Global>(queryGlobal, ({ data: { global } }) => {
  if (global) {
    const { rawTotalRedistributedCollateral, rawTotalRedistributedDebt } = global;

    return new Trove(
      decimalify(rawTotalRedistributedCollateral),
      decimalify(rawTotalRedistributedDebt)
    );
  } else {
    return _emptyTrove;
  }
});

const price = new Query<Decimal, Global>(queryGlobal, ({ data: { global } }) =>
  Decimal.from(global?.currentSystemState?.price ?? 200)
);

const total = new Query<Trove, Global>(queryGlobal, ({ data: { global } }) => {
  if (global?.currentSystemState) {
    const { totalCollateral, totalDebt } = global.currentSystemState;

    return new Trove(totalCollateral, totalDebt);
  } else {
    return _emptyTrove;
  }
});

const tokensInStabilityPool = new Query<Decimal, Global>(queryGlobal, ({ data: { global } }) =>
  Decimal.from(global?.currentSystemState?.tokensInStabilityPool ?? 0)
);

const troveRawFields = gql`
  fragment TroveRawFields on Trove {
    owner {
      id
    }
    status
    rawCollateral
    rawDebt
    rawStake
    rawSnapshotOfTotalRedistributedCollateral
    rawSnapshotOfTotalRedistributedDebt
  }
`;

const troveFromRawFields = ({
  owner: { id: ownerAddress },
  status,
  rawCollateral,
  rawDebt,
  rawStake,
  rawSnapshotOfTotalRedistributedCollateral,
  rawSnapshotOfTotalRedistributedDebt
}: TroveRawFields) =>
  new TroveWithPendingRedistribution(
    getAddress(ownerAddress),
    status,
    decimalify(rawCollateral),
    decimalify(rawDebt),
    decimalify(rawStake),

    new Trove(
      decimalify(rawSnapshotOfTotalRedistributedCollateral),
      decimalify(rawSnapshotOfTotalRedistributedDebt)
    )
  );

const troveBeforeRedistribution = new Query<
  TroveWithPendingRedistribution,
  TroveWithoutRewards,
  TroveWithoutRewardsVariables
>(
  gql`
    query TroveWithoutRewards($address: ID!) {
      user(id: $address) {
        id
        trove {
          id
          ...TroveRawFields
        }
      }
    }
    ${troveRawFields}
  `,
  ({ data: { user } }, { address }) => {
    if (user?.trove) {
      return troveFromRawFields(user.trove);
    } else {
      return new TroveWithPendingRedistribution(address, "nonExistent");
    }
  }
);

const troves = new Query<TroveWithPendingRedistribution[], Troves, TrovesVariables>(
  gql`
    query Troves($orderDirection: OrderDirection!, $startingAt: Int!, $first: Int!) {
      troves(
        where: { status: open }
        orderBy: collateralRatioSortKey
        orderDirection: $orderDirection
        skip: $startingAt
        first: $first
      ) {
        id
        ...TroveRawFields
      }
    }
    ${troveRawFields}
  `,
  ({ data: { troves } }) => troves.map(trove => troveFromRawFields(trove))
);

const blockNumberDummy = new Query<void, BlockNumberDummy, BlockNumberDummyVariables>(
  gql`
    query BlockNumberDummy($blockNumber: Int!) {
      globals(block: { number: $blockNumber }) {
        id
      }
    }
  `,
  () => {}
);

export class SubgraphSfStablecoin implements ReadableProtocol, ObservableProtocol {
  private client: ApolloClient<NormalizedCacheObject>;

  constructor(
    uri = "http://localhost:8000/subgraphs/name/stablecoin-sdk/subgraph",
    pollInterval = 4000
  ) {
    this.client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink({ fetch, uri }),
      defaultOptions: {
        query: { fetchPolicy: "network-only" },
        watchQuery: { fetchPolicy: "network-only", pollInterval }
      }
    });
  }

  getTotalRedistributed() {
    return totalRedistributed.get(this.client, undefined);
  }

  watchTotalRedistributed(onTotalRedistributedChanged: (totalRedistributed: Trove) => void) {
    return totalRedistributed.watch(this.client, onTotalRedistributedChanged, undefined);
  }

  getTroveBeforeRedistribution(address?: string) {
    return troveBeforeRedistribution.get(this.client, { address: normalizeAddress(address) });
  }

  watchTroveWithoutRewards(
    onTroveChanged: (trove: TroveWithPendingRedistribution) => void,
    address?: string
  ) {
    return troveBeforeRedistribution.watch(this.client, onTroveChanged, {
      address: normalizeAddress(address)
    });
  }

  async getTrove(address?: string) {
    const [trove, totalRedistributed] = await Promise.all([
      this.getTroveBeforeRedistribution(address),
      this.getTotalRedistributed()
    ] as const);

    return trove.applyRedistribution(totalRedistributed);
  }

  getNumberOfTroves(): Promise<number> {
    return numberOfTroves.get(this.client, undefined);
  }

  watchNumberOfTroves(onNumberOfTrovesChanged: (numberOfTroves: number) => void): () => void {
    return numberOfTroves.watch(this.client, onNumberOfTrovesChanged, undefined);
  }

  getPrice() {
    return price.get(this.client, undefined);
  }

  watchPrice(onPriceChanged: (price: Decimal) => void) {
    return price.watch(this.client, onPriceChanged, undefined);
  }

  getTotal() {
    return total.get(this.client, undefined);
  }

  watchTotal(onTotalChanged: (total: Trove) => void) {
    return total.watch(this.client, onTotalChanged, undefined);
  }

  getStabilityDeposit(address?: string): Promise<StabilityDeposit> {
    throw new Error("Method not implemented.");
  }

  watchStabilityDeposit(
    onStabilityDepositChanged: (stabilityDeposit: StabilityDeposit) => void,
    address?: string
  ): () => void {
    throw new Error("Method not implemented.");
  }

  getDebtTokenInStabilityPool() {
    return tokensInStabilityPool.get(this.client, undefined);
  }

  watchDebtTokenInStabilityPool(
    onDebtTokenInStabilityPoolChanged: (debtTokenInStabilityPool: Decimal) => void
  ) {
    return tokensInStabilityPool.watch(this.client, onDebtTokenInStabilityPoolChanged, undefined);
  }

  getDebtTokenBalance(address?: string): Promise<Decimal> {
    throw new Error("Method not implemented.");
  }

  watchDebtTokenBalance(
    onDebtTokenBalanceChanged: (balance: Decimal) => void,
    address?: string
  ): () => void {
    throw new Error("Method not implemented.");
  }

  getProtocolTokenBalance(address?: string): Promise<Decimal> {
    throw new Error("Method not implemented.");
  }

  getCollateralSurplusBalance(address?: string): Promise<Decimal> {
    throw new Error("Method not implemented.");
  }

  getTroves(
    params: TroveListingParams & { beforeRedistribution: true }
  ): Promise<TroveWithPendingRedistribution[]>;

  getTroves(params: TroveListingParams): Promise<UserTrove[]>;

  async getTroves(params: TroveListingParams) {
    const { first, sortedBy, startingAt = 0, beforeRedistribution } = params;

    const [totalRedistributed, _troves] = await Promise.all([
      beforeRedistribution ? undefined : this.getTotalRedistributed(),
      troves.get(this.client, {
        first,
        startingAt,
        orderDirection:
          sortedBy === "ascendingCollateralRatio" ? OrderDirection.asc : OrderDirection.desc
      })
    ]);

    if (totalRedistributed) {
      return _troves.map(trove => trove.applyRedistribution(totalRedistributed));
    } else {
      return _troves;
    }
  }

  async waitForBlock(blockNumber: number) {
    for (;;) {
      try {
        await blockNumberDummy.get(this.client, { blockNumber });
      } catch {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      return;
    }
  }

  getFees(): Promise<Fees> {
    throw new Error("Method not implemented.");
  }

  getProtocolTokenStake(address?: string): Promise<ProtocolTokenStake> {
    throw new Error("Method not implemented.");
  }

  getTotalStakedProtocolToken(): Promise<Decimal> {
    throw new Error("Method not implemented.");
  }

  getFrontendStatus(address?: string): Promise<FrontendStatus> {
    throw new Error("Method not implemented.");
  }

  getUniTokenBalance(address?: string): Promise<Decimal> {
    throw new Error("Method not implemented.");
  }

  getUniTokenAllowance(address?: string): Promise<Decimal> {
    throw new Error("Method not implemented.");
  }

  getRemainingProtocolMiningProtocolTokenReward(): Promise<Decimal> {
    throw new Error("Method not implemented.");
  }

  getLiquidityMiningStake(address?: string): Promise<Decimal> {
    throw new Error("Method not implemented.");
  }

  getLiquidityMiningProtocolTokenReward(address?: string): Promise<Decimal> {
    throw new Error("Method not implemented.");
  }

  getTotalStakedUniTokens(): Promise<Decimal> {
    throw new Error("Method not implemented.");
  }

  getRemainingStabilityPoolProtocolTokenReward(): Promise<Decimal> {
    throw new Error("Method not implemented.");
  }

  findHintsForNominalCollateralRatio(
    nominalCollateralRatio: Decimalish
  ): Promise<[firstHint: string, secondHint: string]> {
    throw new Error("Method not implemented.");
  }

  findRedemptionHints(
    amount: Decimalish
  ): Promise<
    [
      truncatedAmount: Decimal,
      firstRedemptionHint: string,
      partialRedemptionUpperHint: string,
      partialRedemptionLowerHint: string,
      partialRedemptionHintNICR: BigNumber
    ]
  > {
    throw new Error("Method not implemented.");
  }

  getDebtInFront(address: string, iterations: number): Promise<[debt: Decimal, next: string]> {
    throw new Error("Method not implemented.");
  }
}
