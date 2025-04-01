import { AddressZero } from "@ethersproject/constants";
import assert from "assert";

import {
  Decimal,
  Fees,
  ProtocolTokenStake,
  SfStablecoinStore,
  SfStablecoinStoreBaseState,
  SfStablecoinStoreState,
  StabilityDeposit,
  TroveWithPendingRedistribution
} from "@secured-finance/stablecoin-lib-base";

import { decimalify, promiseAllValues } from "./_utils";
import { EthersConnection, _getProvider } from "./EthersConnection";
import { ReadableEthers } from "./ReadableEthers";
import { EthersCallOverrides, EthersProvider } from "./types";

/**
 * Extra state added to {@link @secured-finance/stablecoin-lib-base#SfStablecoinStoreState} by
 * {@link BlockPolledSfStablecoinStore}.
 *
 * @public
 */
export interface BlockPolledSfStablecoinStoreExtraState {
  /**
   * Number of block that the store state was fetched from.
   *
   * @remarks
   * May be undefined when the store state is fetched for the first time.
   */
  blockTag?: number;

  /**
   * Timestamp of latest block (number of seconds since epoch).
   */
  blockTimestamp: number;

  /** @internal */
  _feesFactory: (blockTimestamp: number, recoveryMode: boolean) => Fees;
}

/**
 * The type of {@link BlockPolledSfStablecoinStore}'s
 * {@link @secured-finance/stablecoin-lib-base#SfStablecoinStore.state | state}.
 *
 * @public
 */
export type BlockPolledSfStablecoinStoreState =
  SfStablecoinStoreState<BlockPolledSfStablecoinStoreExtraState>;

/**
 * Ethers-based {@link @secured-finance/stablecoin-lib-base#SfStablecoinStore} that updates state whenever there's a new
 * block.
 *
 * @public
 */
export class BlockPolledSfStablecoinStore extends SfStablecoinStore<BlockPolledSfStablecoinStoreExtraState> {
  readonly connection: EthersConnection;

  private readonly _readable: ReadableEthers;
  private readonly _provider: EthersProvider;

  constructor(readable: ReadableEthers) {
    super();

    this.connection = readable.connection;
    this._readable = readable;
    this._provider = _getProvider(readable.connection);
  }

  private async _getRiskiestTroveBeforeRedistribution(
    overrides?: EthersCallOverrides
  ): Promise<TroveWithPendingRedistribution> {
    const riskiestTroves = await this._readable.getTroves(
      { first: 1, sortedBy: "ascendingCollateralRatio", beforeRedistribution: true },
      overrides
    );

    if (riskiestTroves.length === 0) {
      return new TroveWithPendingRedistribution(AddressZero, "nonExistent");
    }

    return riskiestTroves[0];
  }

  private async _get(
    blockTag?: number
  ): Promise<
    [baseState: SfStablecoinStoreBaseState, extraState: BlockPolledSfStablecoinStoreExtraState]
  > {
    const { userAddress, frontendTag } = this.connection;

    const { blockTimestamp, _feesFactory, calculateRemainingProtocolToken, ...baseState } =
      await promiseAllValues({
        blockTimestamp: this._readable._getBlockTimestamp(blockTag),
        _feesFactory: this._readable._getFeesFactory({ blockTag }),
        calculateRemainingProtocolToken:
          this._readable._getRemainingProtocolMiningProtocolTokenRewardCalculator({
            blockTag
          }),

        price: this._readable.getPrice({ blockTag }),
        numberOfTroves: this._readable.getNumberOfTroves({ blockTag }),
        totalRedistributed: this._readable.getTotalRedistributed({ blockTag }),
        total: this._readable.getTotal({ blockTag }),
        debtTokenInStabilityPool: this._readable.getDebtTokenInStabilityPool({ blockTag }),
        totalStakedProtocolToken: this._readable.getTotalStakedProtocolToken({ blockTag }),
        _riskiestTroveBeforeRedistribution: this._getRiskiestTroveBeforeRedistribution({ blockTag }),
        totalStakedUniTokens: this._readable.getTotalStakedUniTokens({ blockTag }),
        remainingStabilityPoolProtocolTokenReward:
          this._readable.getRemainingStabilityPoolProtocolTokenReward({
            blockTag
          }),

        frontend: frontendTag
          ? this._readable.getFrontendStatus(frontendTag, { blockTag })
          : { status: "unregistered" as const },

        ...(userAddress
          ? {
              accountBalance: this._provider.getBalance(userAddress, blockTag).then(decimalify),
              debtTokenBalance: this._readable.getDebtTokenBalance(userAddress, { blockTag }),
              protocolTokenBalance: this._readable.getProtocolTokenBalance(userAddress, {
                blockTag
              }),
              uniTokenBalance: this._readable.getUniTokenBalance(userAddress, { blockTag }),
              uniTokenAllowance: this._readable.getUniTokenAllowance(userAddress, { blockTag }),
              liquidityMiningStake: this._readable.getLiquidityMiningStake(userAddress, {
                blockTag
              }),
              liquidityMiningProtocolTokenReward:
                this._readable.getLiquidityMiningProtocolTokenReward(userAddress, {
                  blockTag
                }),
              collateralSurplusBalance: this._readable.getCollateralSurplusBalance(userAddress, {
                blockTag
              }),
              troveBeforeRedistribution: this._readable.getTroveBeforeRedistribution(userAddress, {
                blockTag
              }),
              stabilityDeposit: this._readable.getStabilityDeposit(userAddress, { blockTag }),
              protocolTokenStake: this._readable.getProtocolTokenStake(userAddress, { blockTag }),
              ownFrontend: this._readable.getFrontendStatus(userAddress, { blockTag }),
              debtInFront: this._readable.getDebtInFront(userAddress, 500, { blockTag })
            }
          : {
              accountBalance: Decimal.ZERO,
              debtTokenBalance: Decimal.ZERO,
              protocolTokenBalance: Decimal.ZERO,
              uniTokenBalance: Decimal.ZERO,
              uniTokenAllowance: Decimal.ZERO,
              liquidityMiningStake: Decimal.ZERO,
              liquidityMiningProtocolTokenReward: Decimal.ZERO,
              collateralSurplusBalance: Decimal.ZERO,
              troveBeforeRedistribution: new TroveWithPendingRedistribution(
                AddressZero,
                "nonExistent"
              ),
              stabilityDeposit: new StabilityDeposit(
                Decimal.ZERO,
                Decimal.ZERO,
                Decimal.ZERO,
                Decimal.ZERO,
                AddressZero
              ),
              protocolTokenStake: new ProtocolTokenStake(),
              ownFrontend: { status: "unregistered" as const },
              debtInFront: [Decimal.ZERO, AddressZero] as [debt: Decimal, next: string]
            })
      });

    return [
      {
        ...baseState,
        _feesInNormalMode: _feesFactory(blockTimestamp, false),
        remainingProtocolMiningProtocolTokenReward: calculateRemainingProtocolToken(blockTimestamp)
      },
      {
        blockTag,
        blockTimestamp,
        _feesFactory
      }
    ];
  }

  /** @internal @override */
  protected _doStart(): () => void {
    this._get().then(state => {
      if (!this._loaded) {
        this._load(...state);
      }
    });

    const handleBlock = async (blockTag: number) => {
      const state = await this._get(blockTag);

      if (this._loaded) {
        this._update(...state);
      } else {
        this._load(...state);
      }
    };

    let latestBlock: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const blockListener = (blockTag: number) => {
      latestBlock = Math.max(blockTag, latestBlock ?? blockTag);

      if (timerId !== undefined) {
        clearTimeout(timerId);
      }

      timerId = setTimeout(() => {
        assert(latestBlock !== undefined);
        handleBlock(latestBlock);
      }, 50);
    };

    this._provider.on("block", blockListener);

    return () => {
      this._provider.off("block", blockListener);

      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
    };
  }

  /** @internal @override */
  protected _reduceExtra(
    oldState: BlockPolledSfStablecoinStoreExtraState,
    stateUpdate: Partial<BlockPolledSfStablecoinStoreExtraState>
  ): BlockPolledSfStablecoinStoreExtraState {
    return {
      blockTag: stateUpdate.blockTag ?? oldState.blockTag,
      blockTimestamp: stateUpdate.blockTimestamp ?? oldState.blockTimestamp,
      _feesFactory: stateUpdate._feesFactory ?? oldState._feesFactory
    };
  }
}
