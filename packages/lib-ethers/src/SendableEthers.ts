import {
  CollateralGainTransferDetails,
  Decimalish,
  LiquidationDetails,
  RedemptionDetails,
  SendableProtocol,
  StabilityDepositChangeDetails,
  StabilityPoolGainsWithdrawalDetails,
  TroveAdjustmentDetails,
  TroveAdjustmentParams,
  TroveClosureDetails,
  TroveCreationDetails,
  TroveCreationParams
} from "@secured-finance/stablecoin-lib-base";

import {
  EthersTransactionOverrides,
  EthersTransactionReceipt,
  EthersTransactionResponse
} from "./types";

import {
  BorrowingOperationOptionalParams,
  PopulatableEthers,
  PopulatedEthersTransaction,
  SentEthersTransaction
} from "./PopulatableEthers";

const sendTransaction = <T>(tx: PopulatedEthersTransaction<T>) => tx.send();

/**
 * Ethers-based implementation of {@link @secured-finance/stablecoin-lib-base#SendableProtocol}.
 *
 * @public
 */
export class SendableEthers
  implements SendableProtocol<EthersTransactionReceipt, EthersTransactionResponse>
{
  private _populate: PopulatableEthers;

  constructor(populatable: PopulatableEthers) {
    this._populate = populatable;
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.openTrove} */
  async openTrove(
    params: TroveCreationParams<Decimalish>,
    maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<TroveCreationDetails>> {
    return this._populate
      .openTrove(params, maxBorrowingRateOrOptionalParams, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.closeTrove} */
  closeTrove(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<TroveClosureDetails>> {
    return this._populate.closeTrove(overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.adjustTrove} */
  adjustTrove(
    params: TroveAdjustmentParams<Decimalish>,
    maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<TroveAdjustmentDetails>> {
    return this._populate
      .adjustTrove(params, maxBorrowingRateOrOptionalParams, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.depositCollateral} */
  depositCollateral(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<TroveAdjustmentDetails>> {
    return this._populate.depositCollateral(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.withdrawCollateral} */
  withdrawCollateral(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<TroveAdjustmentDetails>> {
    return this._populate.withdrawCollateral(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.borrowDebtToken} */
  borrowDebtToken(
    amount: Decimalish,
    maxBorrowingRate?: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<TroveAdjustmentDetails>> {
    return this._populate.borrowDebtToken(amount, maxBorrowingRate, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.repayDebtToken} */
  repayDebtToken(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<TroveAdjustmentDetails>> {
    return this._populate.repayDebtToken(amount, overrides).then(sendTransaction);
  }

  /** @internal */
  setPrice(
    price: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<void>> {
    return this._populate.setPrice(price, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.liquidate} */
  liquidate(
    address: string | string[],
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<LiquidationDetails>> {
    return this._populate.liquidate(address, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.liquidateUpTo} */
  liquidateUpTo(
    maximumNumberOfTrovesToLiquidate: number,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<LiquidationDetails>> {
    return this._populate
      .liquidateUpTo(maximumNumberOfTrovesToLiquidate, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.depositDebtTokenInStabilityPool} */
  depositDebtTokenInStabilityPool(
    amount: Decimalish,
    frontendTag?: string,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<StabilityDepositChangeDetails>> {
    return this._populate
      .depositDebtTokenInStabilityPool(amount, frontendTag, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.withdrawDebtTokenFromStabilityPool} */
  withdrawDebtTokenFromStabilityPool(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<StabilityDepositChangeDetails>> {
    return this._populate
      .withdrawDebtTokenFromStabilityPool(amount, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.withdrawGainsFromStabilityPool} */
  withdrawGainsFromStabilityPool(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<StabilityPoolGainsWithdrawalDetails>> {
    return this._populate.withdrawGainsFromStabilityPool(overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.transferCollateralGainToTrove} */
  transferCollateralGainToTrove(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<CollateralGainTransferDetails>> {
    return this._populate.transferCollateralGainToTrove(overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.sendDebtToken} */
  sendDebtToken(
    toAddress: string,
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<void>> {
    return this._populate.sendDebtToken(toAddress, amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.sendProtocolToken} */
  sendProtocolToken(
    toAddress: string,
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<void>> {
    return this._populate.sendProtocolToken(toAddress, amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.redeemDebtToken} */
  redeemDebtToken(
    amount: Decimalish,
    maxRedemptionRate?: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<RedemptionDetails>> {
    return this._populate
      .redeemDebtToken(amount, maxRedemptionRate, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.claimCollateralSurplus} */
  claimCollateralSurplus(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<void>> {
    return this._populate.claimCollateralSurplus(overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.stakeProtocolToken} */
  stakeProtocolToken(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<void>> {
    return this._populate.stakeProtocolToken(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.unstakeProtocolToken} */
  unstakeProtocolToken(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<void>> {
    return this._populate.unstakeProtocolToken(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.withdrawGainsFromStaking} */
  withdrawGainsFromStaking(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<void>> {
    return this._populate.withdrawGainsFromStaking(overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.registerFrontend} */
  registerFrontend(
    kickbackRate: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<void>> {
    return this._populate.registerFrontend(kickbackRate, overrides).then(sendTransaction);
  }

  /** @internal */
  _mintUniToken(
    amount: Decimalish,
    address?: string,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<void>> {
    return this._populate._mintUniToken(amount, address, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.approveUniTokens} */
  approveUniTokens(
    allowance?: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<void>> {
    return this._populate.approveUniTokens(allowance, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.stakeUniTokens} */
  stakeUniTokens(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<void>> {
    return this._populate.stakeUniTokens(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.unstakeUniTokens} */
  unstakeUniTokens(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<void>> {
    return this._populate.unstakeUniTokens(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.withdrawProtocolTokenRewardFromProtocolMining} */
  withdrawProtocolTokenRewardFromProtocolMining(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersTransaction<void>> {
    return this._populate
      .withdrawProtocolTokenRewardFromProtocolMining(overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @secured-finance/stablecoin-lib-base#SendableProtocol.exitLiquidityMining} */
  exitLiquidityMining(overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<void>> {
    return this._populate.exitLiquidityMining(overrides).then(sendTransaction);
  }
}
