import {
  CollateralGainTransferDetails,
  Decimalish,
  LiquidationDetails,
  RedemptionDetails,
  SendableLiquity,
  StabilityDepositChangeDetails,
  StabilityPoolGainsWithdrawalDetails,
  TroveAdjustmentDetails,
  TroveAdjustmentParams,
  TroveClosureDetails,
  TroveCreationDetails,
  TroveCreationParams
} from "@secured-finance/lib-base";

import {
  EthersTransactionOverrides,
  EthersTransactionReceipt,
  EthersTransactionResponse
} from "./types";

import {
  BorrowingOperationOptionalParams,
  PopulatableEthersLiquity,
  PopulatedEthersLiquityTransaction,
  SentEthersLiquityTransaction
} from "./PopulatableEthersLiquity";

const sendTransaction = <T>(tx: PopulatedEthersLiquityTransaction<T>) => tx.send();

/**
 * Ethers-based implementation of {@link @secured-finance/lib-base#SendableLiquity}.
 *
 * @public
 */
export class SendableEthersLiquity
  implements SendableLiquity<EthersTransactionReceipt, EthersTransactionResponse>
{
  private _populate: PopulatableEthersLiquity;

  constructor(populatable: PopulatableEthersLiquity) {
    this._populate = populatable;
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.openTrove} */
  async openTrove(
    params: TroveCreationParams<Decimalish>,
    maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<TroveCreationDetails>> {
    return this._populate
      .openTrove(params, maxBorrowingRateOrOptionalParams, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.closeTrove} */
  closeTrove(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<TroveClosureDetails>> {
    return this._populate.closeTrove(overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.adjustTrove} */
  adjustTrove(
    params: TroveAdjustmentParams<Decimalish>,
    maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<TroveAdjustmentDetails>> {
    return this._populate
      .adjustTrove(params, maxBorrowingRateOrOptionalParams, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.depositCollateral} */
  depositCollateral(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<TroveAdjustmentDetails>> {
    return this._populate.depositCollateral(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.withdrawCollateral} */
  withdrawCollateral(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<TroveAdjustmentDetails>> {
    return this._populate.withdrawCollateral(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.borrowDebtToken} */
  borrowDebtToken(
    amount: Decimalish,
    maxBorrowingRate?: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<TroveAdjustmentDetails>> {
    return this._populate.borrowDebtToken(amount, maxBorrowingRate, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.repayDebtToken} */
  repayDebtToken(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<TroveAdjustmentDetails>> {
    return this._populate.repayDebtToken(amount, overrides).then(sendTransaction);
  }

  /** @internal */
  setPrice(
    price: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<void>> {
    return this._populate.setPrice(price, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.liquidate} */
  liquidate(
    address: string | string[],
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<LiquidationDetails>> {
    return this._populate.liquidate(address, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.liquidateUpTo} */
  liquidateUpTo(
    maximumNumberOfTrovesToLiquidate: number,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<LiquidationDetails>> {
    return this._populate
      .liquidateUpTo(maximumNumberOfTrovesToLiquidate, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.depositDebtTokenInStabilityPool} */
  depositDebtTokenInStabilityPool(
    amount: Decimalish,
    frontendTag?: string,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<StabilityDepositChangeDetails>> {
    return this._populate
      .depositDebtTokenInStabilityPool(amount, frontendTag, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.withdrawDebtTokenFromStabilityPool} */
  withdrawDebtTokenFromStabilityPool(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<StabilityDepositChangeDetails>> {
    return this._populate
      .withdrawDebtTokenFromStabilityPool(amount, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.withdrawGainsFromStabilityPool} */
  withdrawGainsFromStabilityPool(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<StabilityPoolGainsWithdrawalDetails>> {
    return this._populate.withdrawGainsFromStabilityPool(overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.transferCollateralGainToTrove} */
  transferCollateralGainToTrove(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<CollateralGainTransferDetails>> {
    return this._populate.transferCollateralGainToTrove(overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.sendDebtToken} */
  sendDebtToken(
    toAddress: string,
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<void>> {
    return this._populate.sendDebtToken(toAddress, amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.sendProtocolToken} */
  sendProtocolToken(
    toAddress: string,
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<void>> {
    return this._populate.sendProtocolToken(toAddress, amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.redeemDebtToken} */
  redeemDebtToken(
    amount: Decimalish,
    maxRedemptionRate?: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<RedemptionDetails>> {
    return this._populate
      .redeemDebtToken(amount, maxRedemptionRate, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.claimCollateralSurplus} */
  claimCollateralSurplus(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<void>> {
    return this._populate.claimCollateralSurplus(overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.stakeProtocolToken} */
  stakeProtocolToken(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<void>> {
    return this._populate.stakeProtocolToken(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.unstakeProtocolToken} */
  unstakeProtocolToken(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<void>> {
    return this._populate.unstakeProtocolToken(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.withdrawGainsFromStaking} */
  withdrawGainsFromStaking(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<void>> {
    return this._populate.withdrawGainsFromStaking(overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.registerFrontend} */
  registerFrontend(
    kickbackRate: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<void>> {
    return this._populate.registerFrontend(kickbackRate, overrides).then(sendTransaction);
  }

  /** @internal */
  _mintUniToken(
    amount: Decimalish,
    address?: string,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<void>> {
    return this._populate._mintUniToken(amount, address, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.approveUniTokens} */
  approveUniTokens(
    allowance?: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<void>> {
    return this._populate.approveUniTokens(allowance, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.stakeUniTokens} */
  stakeUniTokens(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<void>> {
    return this._populate.stakeUniTokens(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.unstakeUniTokens} */
  unstakeUniTokens(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<void>> {
    return this._populate.unstakeUniTokens(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.withdrawProtocolTokenRewardFromProtocolMining} */
  withdrawProtocolTokenRewardFromProtocolMining(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<void>> {
    return this._populate
      .withdrawProtocolTokenRewardFromProtocolMining(overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/lib-base#SendableLiquity.exitLiquidityMining} */
  exitLiquidityMining(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersLiquityTransaction<void>> {
    return this._populate.exitLiquidityMining(overrides).then(sendTransaction);
  }
}
