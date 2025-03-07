## API Report File for "@secured-finance/stablecoin-lib-ethers"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { BigNumber } from '@ethersproject/bignumber';
import { BigNumberish } from '@ethersproject/bignumber';
import { BlockTag } from '@ethersproject/abstract-provider';
import { CollateralGainTransferDetails } from '@secured-finance/stablecoin-lib-base';
import { Decimal } from '@secured-finance/stablecoin-lib-base';
import { Decimalish } from '@secured-finance/stablecoin-lib-base';
import { ErrorCode } from '@ethersproject/logger';
import { FailedReceipt } from '@secured-finance/stablecoin-lib-base';
import { Fees } from '@secured-finance/stablecoin-lib-base';
import { FrontendStatus } from '@secured-finance/stablecoin-lib-base';
import { LiquidationDetails } from '@secured-finance/stablecoin-lib-base';
import { MinedReceipt } from '@secured-finance/stablecoin-lib-base';
import { ObservableProtocol } from '@secured-finance/stablecoin-lib-base';
import { PopulatableProtocol } from '@secured-finance/stablecoin-lib-base';
import { PopulatedRedemptionInterface } from '@secured-finance/stablecoin-lib-base';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { PopulatedTransactionInterface } from '@secured-finance/stablecoin-lib-base';
import { ProtocolReceipt } from '@secured-finance/stablecoin-lib-base';
import { ProtocolTokenStake } from '@secured-finance/stablecoin-lib-base';
import { Provider } from '@ethersproject/abstract-provider';
import { ReadableProtocol } from '@secured-finance/stablecoin-lib-base';
import { RedemptionDetails } from '@secured-finance/stablecoin-lib-base';
import { SendableProtocol } from '@secured-finance/stablecoin-lib-base';
import { SentProtocolTransaction } from '@secured-finance/stablecoin-lib-base';
import { SfStablecoinStore } from '@secured-finance/stablecoin-lib-base';
import { SfStablecoinStoreState } from '@secured-finance/stablecoin-lib-base';
import { Signer } from '@ethersproject/abstract-signer';
import { StabilityDeposit } from '@secured-finance/stablecoin-lib-base';
import { StabilityDepositChangeDetails } from '@secured-finance/stablecoin-lib-base';
import { StabilityPoolGainsWithdrawalDetails } from '@secured-finance/stablecoin-lib-base';
import { TransactableProtocol } from '@secured-finance/stablecoin-lib-base';
import { TransactionFailedError } from '@secured-finance/stablecoin-lib-base';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { Trove } from '@secured-finance/stablecoin-lib-base';
import { TroveAdjustmentDetails } from '@secured-finance/stablecoin-lib-base';
import { TroveAdjustmentParams } from '@secured-finance/stablecoin-lib-base';
import { TroveClosureDetails } from '@secured-finance/stablecoin-lib-base';
import { TroveCreationDetails } from '@secured-finance/stablecoin-lib-base';
import { TroveCreationParams } from '@secured-finance/stablecoin-lib-base';
import { TroveListingParams } from '@secured-finance/stablecoin-lib-base';
import { TroveWithPendingRedistribution } from '@secured-finance/stablecoin-lib-base';
import { UserTrove } from '@secured-finance/stablecoin-lib-base';

// @public
export class BlockPolledSfStablecoinStore extends SfStablecoinStore<BlockPolledSfStablecoinStoreExtraState> {
    constructor(readable: ReadableEthers);
    // (undocumented)
    readonly connection: EthersConnection;
    // @internal @override (undocumented)
    protected _doStart(): () => void;
    // @internal @override (undocumented)
    protected _reduceExtra(oldState: BlockPolledSfStablecoinStoreExtraState, stateUpdate: Partial<BlockPolledSfStablecoinStoreExtraState>): BlockPolledSfStablecoinStoreExtraState;
}

// @public
export interface BlockPolledSfStablecoinStoreExtraState {
    blockTag?: number;
    blockTimestamp: number;
    // @internal (undocumented)
    _feesFactory: (blockTimestamp: number, recoveryMode: boolean) => Fees;
}

// @public
export type BlockPolledSfStablecoinStoreState = SfStablecoinStoreState<BlockPolledSfStablecoinStoreExtraState>;

// @public
export interface BorrowingOperationOptionalParams {
    borrowingFeeDecayToleranceMinutes?: number;
    maxBorrowingRate?: Decimalish;
}

// @internal (undocumented)
export function _connectByChainId<T>(provider: EthersProvider, signer: EthersSigner | undefined, chainId: number, optionalParams: EthersConnectionOptionalParams & {
    useStore: T;
}): EthersConnection & {
    useStore: T;
};

// @internal (undocumented)
export function _connectByChainId(provider: EthersProvider, signer: EthersSigner | undefined, chainId: number, optionalParams?: EthersConnectionOptionalParams): EthersConnection;

// @public
export interface EthersCallOverrides {
    // (undocumented)
    blockTag?: BlockTag;
}

// @public
export interface EthersConnection extends EthersConnectionOptionalParams {
    // @internal (undocumented)
    readonly [brand]: unique symbol;
    readonly addresses: Record<string, string>;
    readonly bootstrapPeriod: number;
    readonly chainId: number;
    readonly deploymentDate: Date;
    // @internal (undocumented)
    readonly _isDev: boolean;
    readonly liquidityMiningProtocolTokenRewardRate: Decimal;
    // @internal (undocumented)
    readonly _priceFeedIsTestnet: boolean;
    readonly provider: EthersProvider;
    readonly signer?: EthersSigner;
    readonly startBlock: number;
    readonly totalStabilityPoolProtocolTokenReward: Decimal;
    readonly version: string;
}

// @public
export interface EthersConnectionOptionalParams {
    readonly frontendTag?: string;
    readonly userAddress?: string;
    readonly useStore?: EthersSfStablecoinStoreOption;
}

// @public
export type EthersPopulatedTransaction = PopulatedTransaction;

// @public
export type EthersProvider = Provider;

// @public
export class EthersSfStablecoin implements ReadableEthers, TransactableProtocol {
    // @internal
    constructor(readable: ReadableEthers);
    // (undocumented)
    adjustTrove(params: TroveAdjustmentParams<Decimalish>, maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams, overrides?: EthersTransactionOverrides): Promise<TroveAdjustmentDetails>;
    // (undocumented)
    approveUniTokens(allowance?: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
    // (undocumented)
    borrowDebtToken(amount: Decimalish, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<TroveAdjustmentDetails>;
    // (undocumented)
    claimCollateralSurplus(overrides?: EthersTransactionOverrides): Promise<void>;
    // (undocumented)
    closeTrove(overrides?: EthersTransactionOverrides): Promise<TroveClosureDetails>;
    // @internal (undocumented)
    static connect(signerOrProvider: EthersSigner | EthersProvider, optionalParams: EthersConnectionOptionalParams & {
        useStore: "blockPolled";
    }): Promise<EthersSfStablecoinWithStore<BlockPolledSfStablecoinStore>>;
    static connect(signerOrProvider: EthersSigner | EthersProvider, optionalParams?: EthersConnectionOptionalParams): Promise<EthersSfStablecoin>;
    readonly connection: EthersConnection;
    // (undocumented)
    depositCollateral(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<TroveAdjustmentDetails>;
    // (undocumented)
    depositDebtTokenInStabilityPool(amount: Decimalish, frontendTag?: string, overrides?: EthersTransactionOverrides): Promise<StabilityDepositChangeDetails>;
    // (undocumented)
    exitLiquidityMining(overrides?: EthersTransactionOverrides): Promise<void>;
    // (undocumented)
    findHintsForNominalCollateralRatio(nominalCollateralRatio: Decimalish, ownAddress?: string, overrides?: EthersCallOverrides): Promise<[string, string]>;
    // (undocumented)
    findRedemptionHints(amount: Decimalish, overrides?: EthersCallOverrides): Promise<[
        truncatedAmount: Decimal,
        firstRedemptionHint: string,
        partialRedemptionUpperHint: string,
        partialRedemptionLowerHint: string,
        partialRedemptionHintNICR: BigNumber
    ]>;
    // @internal (undocumented)
    static _from(connection: EthersConnection & {
        useStore: "blockPolled";
    }): EthersSfStablecoinWithStore<BlockPolledSfStablecoinStore>;
    // @internal (undocumented)
    static _from(connection: EthersConnection): EthersSfStablecoin;
    // @internal (undocumented)
    _getActivePool(overrides?: EthersCallOverrides): Promise<Trove>;
    // @internal (undocumented)
    _getBlockTimestamp(blockTag?: BlockTag): Promise<number>;
    // (undocumented)
    getCollateralSurplusBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getDebtTokenBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getDebtTokenInStabilityPool(overrides?: EthersCallOverrides): Promise<Decimal>;
    // @internal (undocumented)
    _getDefaultPool(overrides?: EthersCallOverrides): Promise<Trove>;
    // (undocumented)
    getFees(overrides?: EthersCallOverrides): Promise<Fees>;
    // @internal (undocumented)
    _getFeesFactory(overrides?: EthersCallOverrides): Promise<(blockTimestamp: number, recoveryMode: boolean) => Fees>;
    // (undocumented)
    getFrontendStatus(address?: string, overrides?: EthersCallOverrides): Promise<FrontendStatus>;
    // (undocumented)
    getLiquidityMiningProtocolTokenReward(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getLiquidityMiningStake(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getNumberOfTroves(overrides?: EthersCallOverrides): Promise<number>;
    // (undocumented)
    getPrice(overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getProtocolTokenBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getProtocolTokenStake(address?: string, overrides?: EthersCallOverrides): Promise<ProtocolTokenStake>;
    // (undocumented)
    getRemainingProtocolMiningProtocolTokenReward(overrides?: EthersCallOverrides): Promise<Decimal>;
    // @internal (undocumented)
    _getRemainingProtocolMiningProtocolTokenRewardCalculator(overrides?: EthersCallOverrides): Promise<(blockTimestamp: number) => Decimal>;
    // (undocumented)
    getRemainingStabilityPoolProtocolTokenReward(overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getStabilityDeposit(address?: string, overrides?: EthersCallOverrides): Promise<StabilityDeposit>;
    // (undocumented)
    getTotal(overrides?: EthersCallOverrides): Promise<Trove>;
    // (undocumented)
    getTotalRedistributed(overrides?: EthersCallOverrides): Promise<Trove>;
    // (undocumented)
    getTotalStakedProtocolToken(overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getTotalStakedUniTokens(overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getTrove(address?: string, overrides?: EthersCallOverrides): Promise<UserTrove>;
    // (undocumented)
    getTroveBeforeRedistribution(address?: string, overrides?: EthersCallOverrides): Promise<TroveWithPendingRedistribution>;
    // @internal (undocumented)
    getTroves(params: TroveListingParams & {
        beforeRedistribution: true;
    }, overrides?: EthersCallOverrides): Promise<TroveWithPendingRedistribution[]>;
    // (undocumented)
    getTroves(params: TroveListingParams, overrides?: EthersCallOverrides): Promise<UserTrove[]>;
    // (undocumented)
    getUniTokenAllowance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getUniTokenBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    hasStore(): this is EthersSfStablecoinWithStore;
    hasStore(store: "blockPolled"): this is EthersSfStablecoinWithStore<BlockPolledSfStablecoinStore>;
    // (undocumented)
    liquidate(address: string | string[], overrides?: EthersTransactionOverrides): Promise<LiquidationDetails>;
    // (undocumented)
    liquidateUpTo(maximumNumberOfTrovesToLiquidate: number, overrides?: EthersTransactionOverrides): Promise<LiquidationDetails>;
    // @internal (undocumented)
    _mintUniToken(amount: Decimalish, address?: string, overrides?: EthersTransactionOverrides): Promise<void>;
    // (undocumented)
    openTrove(params: TroveCreationParams<Decimalish>, maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams, overrides?: EthersTransactionOverrides): Promise<TroveCreationDetails>;
    readonly populate: PopulatableEthers;
    // (undocumented)
    redeemDebtToken(amount: Decimalish, maxRedemptionRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<RedemptionDetails>;
    // (undocumented)
    registerFrontend(kickbackRate: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
    // (undocumented)
    repayDebtToken(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<TroveAdjustmentDetails>;
    readonly send: SendableEthers;
    // (undocumented)
    sendDebtToken(toAddress: string, amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
    // (undocumented)
    sendProtocolToken(toAddress: string, amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
    // @internal (undocumented)
    setPrice(price: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
    // (undocumented)
    stakeProtocolToken(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
    // (undocumented)
    stakeUniTokens(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
    // (undocumented)
    transferCollateralGainToTrove(overrides?: EthersTransactionOverrides): Promise<CollateralGainTransferDetails>;
    // (undocumented)
    unstakeProtocolToken(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
    // (undocumented)
    unstakeUniTokens(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
    // (undocumented)
    withdrawCollateral(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<TroveAdjustmentDetails>;
    // (undocumented)
    withdrawDebtTokenFromStabilityPool(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<StabilityDepositChangeDetails>;
    // (undocumented)
    withdrawGainsFromStabilityPool(overrides?: EthersTransactionOverrides): Promise<StabilityPoolGainsWithdrawalDetails>;
    // (undocumented)
    withdrawGainsFromStaking(overrides?: EthersTransactionOverrides): Promise<void>;
    // (undocumented)
    withdrawProtocolTokenRewardFromProtocolMining(overrides?: EthersTransactionOverrides): Promise<void>;
}

// @public
export type EthersSfStablecoinStoreOption = "blockPolled";

// @public
export interface EthersSfStablecoinWithStore<T extends SfStablecoinStore = SfStablecoinStore> extends EthersSfStablecoin {
    readonly store: T;
}

// @public
export type EthersSigner = Signer;

// @public
export class EthersTransactionCancelledError extends Error {
    // @internal
    constructor(rawError: _RawTransactionReplacedError);
    // (undocumented)
    readonly rawError: Error;
    // (undocumented)
    readonly rawReplacementReceipt: EthersTransactionReceipt;
}

// @public
export class EthersTransactionFailedError extends TransactionFailedError<FailedReceipt<EthersTransactionReceipt>> {
    constructor(message: string, failedReceipt: FailedReceipt<EthersTransactionReceipt>);
}

// @public
export interface EthersTransactionOverrides {
    // (undocumented)
    from?: string;
    // (undocumented)
    gasLimit?: BigNumberish;
    // (undocumented)
    gasPrice?: BigNumberish;
    // (undocumented)
    nonce?: BigNumberish;
}

// @public
export type EthersTransactionReceipt = TransactionReceipt;

// @public
export type EthersTransactionResponse = TransactionResponse;

// @alpha (undocumented)
export class ObservableEthers implements ObservableProtocol {
    constructor(readable: ReadableEthers);
    // (undocumented)
    watchDebtTokenBalance(onDebtTokenBalanceChanged: (balance: Decimal) => void, address?: string): () => void;
    // (undocumented)
    watchDebtTokenInStabilityPool(onDebtTokenInStabilityPoolChanged: (debtTokenInStabilityPool: Decimal) => void): () => void;
    // (undocumented)
    watchNumberOfTroves(onNumberOfTrovesChanged: (numberOfTroves: number) => void): () => void;
    // (undocumented)
    watchPrice(onPriceChanged: (price: Decimal) => void): () => void;
    // (undocumented)
    watchStabilityDeposit(onStabilityDepositChanged: (stabilityDeposit: StabilityDeposit) => void, address?: string): () => void;
    // (undocumented)
    watchTotal(onTotalChanged: (total: Trove) => void): () => void;
    // (undocumented)
    watchTotalRedistributed(onTotalRedistributedChanged: (totalRedistributed: Trove) => void): () => void;
    // (undocumented)
    watchTroveWithoutRewards(onTroveChanged: (trove: TroveWithPendingRedistribution) => void, address?: string): () => void;
}

// @public
export class PopulatableEthers implements PopulatableProtocol<EthersTransactionReceipt, EthersTransactionResponse, EthersPopulatedTransaction> {
    constructor(readable: ReadableEthers);
    // (undocumented)
    adjustTrove(params: TroveAdjustmentParams<Decimalish>, maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<TroveAdjustmentDetails>>;
    // (undocumented)
    approveUniTokens(allowance?: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<void>>;
    // (undocumented)
    borrowDebtToken(amount: Decimalish, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<TroveAdjustmentDetails>>;
    // (undocumented)
    claimCollateralSurplus(overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<void>>;
    // (undocumented)
    closeTrove(overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<TroveClosureDetails>>;
    // (undocumented)
    depositCollateral(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<TroveAdjustmentDetails>>;
    // (undocumented)
    depositDebtTokenInStabilityPool(amount: Decimalish, frontendTag?: string, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<StabilityDepositChangeDetails>>;
    // (undocumented)
    exitLiquidityMining(overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<void>>;
    // (undocumented)
    liquidate(address: string | string[], overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<LiquidationDetails>>;
    // (undocumented)
    liquidateUpTo(maximumNumberOfTrovesToLiquidate: number, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<LiquidationDetails>>;
    // @internal (undocumented)
    _mintUniToken(amount: Decimalish, address?: string, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<void>>;
    // (undocumented)
    openTrove(params: TroveCreationParams<Decimalish>, maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<TroveCreationDetails>>;
    // (undocumented)
    redeemDebtToken(amount: Decimalish, maxRedemptionRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersRedemption>;
    // (undocumented)
    registerFrontend(kickbackRate: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<void>>;
    // (undocumented)
    repayDebtToken(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<TroveAdjustmentDetails>>;
    // (undocumented)
    sendDebtToken(toAddress: string, amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<void>>;
    // (undocumented)
    sendProtocolToken(toAddress: string, amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<void>>;
    // @internal (undocumented)
    setPrice(price: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<void>>;
    // (undocumented)
    stakeProtocolToken(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<void>>;
    // (undocumented)
    stakeUniTokens(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<void>>;
    // (undocumented)
    transferCollateralGainToTrove(overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<CollateralGainTransferDetails>>;
    // (undocumented)
    unstakeProtocolToken(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<void>>;
    // (undocumented)
    unstakeUniTokens(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<void>>;
    // (undocumented)
    withdrawCollateral(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<TroveAdjustmentDetails>>;
    // (undocumented)
    withdrawDebtTokenFromStabilityPool(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<StabilityDepositChangeDetails>>;
    // (undocumented)
    withdrawGainsFromStabilityPool(overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<StabilityPoolGainsWithdrawalDetails>>;
    // (undocumented)
    withdrawGainsFromStaking(overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<void>>;
    // (undocumented)
    withdrawProtocolTokenRewardFromProtocolMining(overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<void>>;
    }

// @public (undocumented)
export class PopulatedEthersRedemption extends PopulatedEthersTransaction<RedemptionDetails> implements PopulatedRedemptionInterface<EthersPopulatedTransaction, EthersTransactionResponse, EthersTransactionReceipt> {
    // @internal
    constructor(rawPopulatedTransaction: EthersPopulatedTransaction, connection: EthersConnection, attemptedDebtTokenAmount: Decimal, redeemableDebtTokenAmount: Decimal, increaseAmountByMinimumNetDebt?: (maxRedemptionRate?: Decimalish) => Promise<PopulatedEthersRedemption>);
    // (undocumented)
    readonly attemptedDebtTokenAmount: Decimal;
    // (undocumented)
    increaseAmountByMinimumNetDebt(maxRedemptionRate?: Decimalish): Promise<PopulatedEthersRedemption>;
    // (undocumented)
    readonly isTruncated: boolean;
    // (undocumented)
    readonly redeemableDebtTokenAmount: Decimal;
}

// @public
export class PopulatedEthersTransaction<T = unknown> implements PopulatedTransactionInterface<EthersPopulatedTransaction, SentEthersTransaction<T>> {
    // @internal
    constructor(rawPopulatedTransaction: EthersPopulatedTransaction, connection: EthersConnection, parse: (rawReceipt: EthersTransactionReceipt) => T, gasHeadroom?: number);
    readonly gasHeadroom?: number;
    readonly rawPopulatedTransaction: EthersPopulatedTransaction;
    // (undocumented)
    send(): Promise<SentEthersTransaction<T>>;
}

// @internal (undocumented)
export enum _RawErrorReason {
    // (undocumented)
    TRANSACTION_CANCELLED = "cancelled",
    // (undocumented)
    TRANSACTION_FAILED = "transaction failed",
    // (undocumented)
    TRANSACTION_REPLACED = "replaced",
    // (undocumented)
    TRANSACTION_REPRICED = "repriced"
}

// @internal (undocumented)
export interface _RawTransactionReplacedError extends Error {
    // (undocumented)
    cancelled: boolean;
    // (undocumented)
    code: ErrorCode.TRANSACTION_REPLACED;
    // (undocumented)
    hash: string;
    // (undocumented)
    reason: _RawErrorReason.TRANSACTION_CANCELLED | _RawErrorReason.TRANSACTION_REPLACED | _RawErrorReason.TRANSACTION_REPRICED;
    // (undocumented)
    receipt: EthersTransactionReceipt;
    // (undocumented)
    replacement: EthersTransactionResponse;
}

// @public
export class ReadableEthers implements ReadableProtocol {
    // @internal
    constructor(connection: EthersConnection);
    // @internal (undocumented)
    static connect(signerOrProvider: EthersSigner | EthersProvider, optionalParams: EthersConnectionOptionalParams & {
        useStore: "blockPolled";
    }): Promise<ReadableEthersWithStore<BlockPolledSfStablecoinStore>>;
    // (undocumented)
    static connect(signerOrProvider: EthersSigner | EthersProvider, optionalParams?: EthersConnectionOptionalParams): Promise<ReadableEthers>;
    // (undocumented)
    readonly connection: EthersConnection;
    // (undocumented)
    findHintsForNominalCollateralRatio(nominalCollateralRatio: Decimal, ownAddress?: string, overrides?: EthersCallOverrides): Promise<[string, string]>;
    // (undocumented)
    findRedemptionHints(amount: Decimal, overrides?: EthersCallOverrides): Promise<[
        truncatedAmount: Decimal,
        firstRedemptionHint: string,
        partialRedemptionUpperHint: string,
        partialRedemptionLowerHint: string,
        partialRedemptionHintNICR: BigNumber
    ]>;
    // @internal (undocumented)
    static _from(connection: EthersConnection & {
        useStore: "blockPolled";
    }): ReadableEthersWithStore<BlockPolledSfStablecoinStore>;
    // @internal (undocumented)
    static _from(connection: EthersConnection): ReadableEthers;
    // @internal (undocumented)
    _getActivePool(overrides?: EthersCallOverrides): Promise<Trove>;
    // @internal (undocumented)
    _getBlockTimestamp(blockTag?: BlockTag): Promise<number>;
    // (undocumented)
    getCollateralSurplusBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getDebtTokenBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getDebtTokenInStabilityPool(overrides?: EthersCallOverrides): Promise<Decimal>;
    // @internal (undocumented)
    _getDefaultPool(overrides?: EthersCallOverrides): Promise<Trove>;
    // (undocumented)
    getFees(overrides?: EthersCallOverrides): Promise<Fees>;
    // @internal (undocumented)
    _getFeesFactory(overrides?: EthersCallOverrides): Promise<(blockTimestamp: number, recoveryMode: boolean) => Fees>;
    // (undocumented)
    getFrontendStatus(address?: string, overrides?: EthersCallOverrides): Promise<FrontendStatus>;
    // (undocumented)
    getLiquidityMiningProtocolTokenReward(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getLiquidityMiningStake(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getNumberOfTroves(overrides?: EthersCallOverrides): Promise<number>;
    // (undocumented)
    getPrice(overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getProtocolTokenBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getProtocolTokenStake(address?: string, overrides?: EthersCallOverrides): Promise<ProtocolTokenStake>;
    // (undocumented)
    getRemainingProtocolMiningProtocolTokenReward(overrides?: EthersCallOverrides): Promise<Decimal>;
    // @internal (undocumented)
    _getRemainingProtocolMiningProtocolTokenRewardCalculator(overrides?: EthersCallOverrides): Promise<(blockTimestamp: number) => Decimal>;
    // (undocumented)
    getRemainingStabilityPoolProtocolTokenReward(overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getStabilityDeposit(address?: string, overrides?: EthersCallOverrides): Promise<StabilityDeposit>;
    // (undocumented)
    getTotal(overrides?: EthersCallOverrides): Promise<Trove>;
    // (undocumented)
    getTotalRedistributed(overrides?: EthersCallOverrides): Promise<Trove>;
    // (undocumented)
    getTotalStakedProtocolToken(overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getTotalStakedUniTokens(overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getTrove(address?: string, overrides?: EthersCallOverrides): Promise<UserTrove>;
    // (undocumented)
    getTroveBeforeRedistribution(address?: string, overrides?: EthersCallOverrides): Promise<TroveWithPendingRedistribution>;
    // @internal (undocumented)
    getTroves(params: TroveListingParams & {
        beforeRedistribution: true;
    }, overrides?: EthersCallOverrides): Promise<TroveWithPendingRedistribution[]>;
    // (undocumented)
    getTroves(params: TroveListingParams, overrides?: EthersCallOverrides): Promise<UserTrove[]>;
    // (undocumented)
    getUniTokenAllowance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    // (undocumented)
    getUniTokenBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    hasStore(): this is ReadableEthersWithStore;
    hasStore(store: "blockPolled"): this is ReadableEthersWithStore<BlockPolledSfStablecoinStore>;
}

// @public
export interface ReadableEthersWithStore<T extends SfStablecoinStore = SfStablecoinStore> extends ReadableEthers {
    readonly store: T;
}

// @public (undocumented)
export const redeemMaxIterations = 70;

// @public
export class SendableEthers implements SendableProtocol<EthersTransactionReceipt, EthersTransactionResponse> {
    constructor(populatable: PopulatableEthers);
    // (undocumented)
    adjustTrove(params: TroveAdjustmentParams<Decimalish>, maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<TroveAdjustmentDetails>>;
    // (undocumented)
    approveUniTokens(allowance?: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<void>>;
    // (undocumented)
    borrowDebtToken(amount: Decimalish, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<TroveAdjustmentDetails>>;
    // (undocumented)
    claimCollateralSurplus(overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<void>>;
    // (undocumented)
    closeTrove(overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<TroveClosureDetails>>;
    // (undocumented)
    depositCollateral(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<TroveAdjustmentDetails>>;
    // (undocumented)
    depositDebtTokenInStabilityPool(amount: Decimalish, frontendTag?: string, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<StabilityDepositChangeDetails>>;
    // (undocumented)
    exitLiquidityMining(overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<void>>;
    // (undocumented)
    liquidate(address: string | string[], overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<LiquidationDetails>>;
    // (undocumented)
    liquidateUpTo(maximumNumberOfTrovesToLiquidate: number, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<LiquidationDetails>>;
    // @internal (undocumented)
    _mintUniToken(amount: Decimalish, address?: string, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<void>>;
    // (undocumented)
    openTrove(params: TroveCreationParams<Decimalish>, maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<TroveCreationDetails>>;
    // (undocumented)
    redeemDebtToken(amount: Decimalish, maxRedemptionRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<RedemptionDetails>>;
    // (undocumented)
    registerFrontend(kickbackRate: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<void>>;
    // (undocumented)
    repayDebtToken(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<TroveAdjustmentDetails>>;
    // (undocumented)
    sendDebtToken(toAddress: string, amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<void>>;
    // (undocumented)
    sendProtocolToken(toAddress: string, amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<void>>;
    // @internal (undocumented)
    setPrice(price: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<void>>;
    // (undocumented)
    stakeProtocolToken(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<void>>;
    // (undocumented)
    stakeUniTokens(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<void>>;
    // (undocumented)
    transferCollateralGainToTrove(overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<CollateralGainTransferDetails>>;
    // (undocumented)
    unstakeProtocolToken(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<void>>;
    // (undocumented)
    unstakeUniTokens(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<void>>;
    // (undocumented)
    withdrawCollateral(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<TroveAdjustmentDetails>>;
    // (undocumented)
    withdrawDebtTokenFromStabilityPool(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<StabilityDepositChangeDetails>>;
    // (undocumented)
    withdrawGainsFromStabilityPool(overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<StabilityPoolGainsWithdrawalDetails>>;
    // (undocumented)
    withdrawGainsFromStaking(overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<void>>;
    // (undocumented)
    withdrawProtocolTokenRewardFromProtocolMining(overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<void>>;
}

// @public
export class SentEthersTransaction<T = unknown> implements SentProtocolTransaction<EthersTransactionResponse, ProtocolReceipt<EthersTransactionReceipt, T>> {
    // @internal
    constructor(rawSentTransaction: EthersTransactionResponse, connection: EthersConnection, parse: (rawReceipt: EthersTransactionReceipt) => T);
    // (undocumented)
    getReceipt(): Promise<ProtocolReceipt<EthersTransactionReceipt, T>>;
    readonly rawSentTransaction: EthersTransactionResponse;
    // (undocumented)
    waitForReceipt(): Promise<MinedReceipt<EthersTransactionReceipt, T>>;
}

// @internal (undocumented)
export interface _TroveChangeWithFees<T> {
    // (undocumented)
    fee: Decimal;
    // (undocumented)
    newTrove: Trove;
    // (undocumented)
    params: T;
}

// @public
export class UnsupportedNetworkError extends Error {
    // @internal
    constructor(chainId: number);
    readonly chainId: number;
}


// (No @packageDocumentation comment for this package)

```
