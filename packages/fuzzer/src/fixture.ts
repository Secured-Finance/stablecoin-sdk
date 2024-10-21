import { Signer } from "@ethersproject/abstract-signer";

import {
  Decimal,
  Decimalish,
  MINIMUM_DEBT,
  ProtocolTokenStake,
  StabilityDeposit,
  TransactableProtocol,
  Trove,
  TroveAdjustmentParams
} from "@secured-finance/lib-base";

import { EthersSfStablecoin as SfStablecoin } from "@secured-finance/lib-ethers";

import {
  benford,
  createRandomTrove,
  getListOfTroveOwners,
  getListOfTroves,
  listDifference,
  objToString,
  randomCollateralChange,
  randomDebtChange,
  shortenAddress
} from "./utils";

import { GasHistogram } from "./GasHistogram";

type _GasHistogramsFrom<T> = {
  [P in keyof T]: T[P] extends (...args: never[]) => Promise<infer R> ? GasHistogram<R> : never;
};

type GasHistograms = Pick<
  _GasHistogramsFrom<TransactableProtocol>,
  | "openTrove"
  | "adjustTrove"
  | "closeTrove"
  | "redeemDebtToken"
  | "depositDebtTokenInStabilityPool"
  | "withdrawDebtTokenFromStabilityPool"
  | "stakeProtocolToken"
  | "unstakeProtocolToken"
>;

export class Fixture {
  private readonly deployerSfStablecoin: SfStablecoin;
  private readonly funder: Signer;
  private readonly funderSfStablecoin: SfStablecoin;
  private readonly funderAddress: string;
  private readonly frontendAddress: string;
  private readonly gasHistograms: GasHistograms;

  private price: Decimal;

  totalNumberOfLiquidations = 0;

  private constructor(
    deployerSfStablecoin: SfStablecoin,
    funder: Signer,
    funderSfStablecoin: SfStablecoin,
    funderAddress: string,
    frontendAddress: string,
    price: Decimal
  ) {
    this.deployerSfStablecoin = deployerSfStablecoin;
    this.funder = funder;
    this.funderSfStablecoin = funderSfStablecoin;
    this.funderAddress = funderAddress;
    this.frontendAddress = frontendAddress;
    this.price = price;

    this.gasHistograms = {
      openTrove: new GasHistogram(),
      adjustTrove: new GasHistogram(),
      closeTrove: new GasHistogram(),
      redeemDebtToken: new GasHistogram(),
      depositDebtTokenInStabilityPool: new GasHistogram(),
      withdrawDebtTokenFromStabilityPool: new GasHistogram(),
      stakeProtocolToken: new GasHistogram(),
      unstakeProtocolToken: new GasHistogram()
    };
  }

  static async setup(
    deployerSfStablecoin: SfStablecoin,
    funder: Signer,
    funderSfStablecoin: SfStablecoin,
    frontendAddress: string,
    frontendSfStablecoin: SfStablecoin
  ) {
    const funderAddress = await funder.getAddress();
    const price = await deployerSfStablecoin.getPrice();

    await frontendSfStablecoin.registerFrontend(Decimal.from(10).div(11));

    return new Fixture(
      deployerSfStablecoin,
      funder,
      funderSfStablecoin,
      funderAddress,
      frontendAddress,
      price
    );
  }

  private async sendDebtTokenFromFunder(toAddress: string, amount: Decimalish) {
    amount = Decimal.from(amount);

    const debtTokenBalance = await this.funderSfStablecoin.getDebtTokenBalance();

    if (debtTokenBalance.lt(amount)) {
      const trove = await this.funderSfStablecoin.getTrove();
      const total = await this.funderSfStablecoin.getTotal();
      const fees = await this.funderSfStablecoin.getFees();

      const targetCollateralRatio =
        trove.isEmpty || !total.collateralRatioIsBelowCritical(this.price)
          ? 1.51
          : Decimal.max(trove.collateralRatio(this.price).add(0.00001), 1.11);

      let newTrove = trove.isEmpty
        ? Trove.create({ depositCollateral: 1, borrowDebtToken: 0 })
        : trove;
      newTrove = newTrove.adjust({ borrowDebtToken: amount.sub(debtTokenBalance).mul(2) });

      if (newTrove.debt.lt(MINIMUM_DEBT)) {
        newTrove = newTrove.setDebt(MINIMUM_DEBT);
      }

      newTrove = newTrove.setCollateral(newTrove.debt.mulDiv(targetCollateralRatio, this.price));

      if (trove.isEmpty) {
        const params = Trove.recreate(newTrove, fees.borrowingRate());
        console.log(`[funder] openTrove(${objToString(params)})`);
        await this.funderSfStablecoin.openTrove(params);
      } else {
        let newTotal = total.add(newTrove).subtract(trove);

        if (
          !total.collateralRatioIsBelowCritical(this.price) &&
          newTotal.collateralRatioIsBelowCritical(this.price)
        ) {
          newTotal = newTotal.setCollateral(newTotal.debt.mulDiv(1.51, this.price));
          newTrove = trove.add(newTotal).subtract(total);
        }

        const params = trove.adjustTo(newTrove, fees.borrowingRate());
        console.log(`[funder] adjustTrove(${objToString(params)})`);
        await this.funderSfStablecoin.adjustTrove(params);
      }
    }

    await this.funderSfStablecoin.sendDebtToken(toAddress, amount);
  }

  async setRandomPrice() {
    this.price = this.price.add(200 * Math.random() + 100).div(2);
    console.log(`[deployer] setPrice(${this.price})`);
    await this.deployerSfStablecoin.setPrice(this.price);

    return this.price;
  }

  async liquidateRandomNumberOfTroves(price: Decimal) {
    const debtTokenInStabilityPoolBefore =
      await this.deployerSfStablecoin.getDebtTokenInStabilityPool();
    console.log(`// Stability Pool balance: ${debtTokenInStabilityPoolBefore}`);

    const trovesBefore = await getListOfTroves(this.deployerSfStablecoin);

    if (trovesBefore.length === 0) {
      console.log("// No Troves to liquidate");
      return;
    }

    const troveOwnersBefore = trovesBefore.map(trove => trove.ownerAddress);
    const lastTrove = trovesBefore[trovesBefore.length - 1];

    if (!lastTrove.collateralRatioIsBelowMinimum(price)) {
      console.log("// No Troves to liquidate");
      return;
    }

    const maximumNumberOfTrovesToLiquidate = Math.floor(50 * Math.random()) + 1;
    console.log(`[deployer] liquidateUpTo(${maximumNumberOfTrovesToLiquidate})`);
    await this.deployerSfStablecoin.liquidateUpTo(maximumNumberOfTrovesToLiquidate);

    const troveOwnersAfter = await getListOfTroveOwners(this.deployerSfStablecoin);
    const liquidatedTroves = listDifference(troveOwnersBefore, troveOwnersAfter);

    if (liquidatedTroves.length > 0) {
      for (const liquidatedTrove of liquidatedTroves) {
        console.log(`// Liquidated ${shortenAddress(liquidatedTrove)}`);
      }
    }

    this.totalNumberOfLiquidations += liquidatedTroves.length;

    const debtTokenInStabilityPoolAfter =
      await this.deployerSfStablecoin.getDebtTokenInStabilityPool();
    console.log(`// Stability Pool balance: ${debtTokenInStabilityPoolAfter}`);
  }

  async openRandomTrove(userAddress: string, sfStablecoin: SfStablecoin) {
    const total = await sfStablecoin.getTotal();
    const fees = await sfStablecoin.getFees();

    let newTrove: Trove;

    const cannotOpen = (newTrove: Trove) =>
      newTrove.debt.lt(MINIMUM_DEBT) ||
      (total.collateralRatioIsBelowCritical(this.price)
        ? !newTrove.isOpenableInRecoveryMode(this.price)
        : newTrove.collateralRatioIsBelowMinimum(this.price) ||
          total.add(newTrove).collateralRatioIsBelowCritical(this.price));

    // do {
    newTrove = createRandomTrove(this.price);
    // } while (cannotOpen(newTrove));

    await this.funder.sendTransaction({
      to: userAddress,
      value: newTrove.collateral.hex
    });

    const params = Trove.recreate(newTrove, fees.borrowingRate());

    if (cannotOpen(newTrove)) {
      console.log(
        `// [${shortenAddress(userAddress)}] openTrove(${objToString(params)}) expected to fail`
      );

      await this.gasHistograms.openTrove.expectFailure(() =>
        sfStablecoin.openTrove(params, undefined, { gasPrice: 0 })
      );
    } else {
      console.log(`[${shortenAddress(userAddress)}] openTrove(${objToString(params)})`);

      await this.gasHistograms.openTrove.expectSuccess(() =>
        sfStablecoin.send.openTrove(params, undefined, { gasPrice: 0 })
      );
    }
  }

  async randomlyAdjustTrove(userAddress: string, sfStablecoin: SfStablecoin, trove: Trove) {
    const total = await sfStablecoin.getTotal();
    const fees = await sfStablecoin.getFees();
    const x = Math.random();

    const params: TroveAdjustmentParams<Decimal> =
      x < 0.333
        ? randomCollateralChange(trove)
        : x < 0.666
        ? randomDebtChange(trove)
        : { ...randomCollateralChange(trove), ...randomDebtChange(trove) };

    const cannotAdjust = (trove: Trove, params: TroveAdjustmentParams<Decimal>) => {
      if (
        params.withdrawCollateral?.gte(trove.collateral) ||
        params.repayDebtToken?.gt(trove.debt.sub(MINIMUM_DEBT))
      ) {
        return true;
      }

      const adjusted = trove.adjust(params, fees.borrowingRate());

      return (
        (params.withdrawCollateral?.nonZero || params.borrowDebtToken?.nonZero) &&
        (adjusted.collateralRatioIsBelowMinimum(this.price) ||
          (total.collateralRatioIsBelowCritical(this.price)
            ? adjusted._nominalCollateralRatio.lt(trove._nominalCollateralRatio)
            : total.add(adjusted).subtract(trove).collateralRatioIsBelowCritical(this.price)))
      );
    };

    if (params.depositCollateral) {
      await this.funder.sendTransaction({
        to: userAddress,
        value: params.depositCollateral.hex
      });
    }

    if (params.repayDebtToken) {
      await this.sendDebtTokenFromFunder(userAddress, params.repayDebtToken);
    }

    if (cannotAdjust(trove, params)) {
      console.log(
        `// [${shortenAddress(userAddress)}] adjustTrove(${objToString(params)}) expected to fail`
      );

      await this.gasHistograms.adjustTrove.expectFailure(() =>
        sfStablecoin.adjustTrove(params, undefined, { gasPrice: 0 })
      );
    } else {
      console.log(`[${shortenAddress(userAddress)}] adjustTrove(${objToString(params)})`);

      await this.gasHistograms.adjustTrove.expectSuccess(() =>
        sfStablecoin.send.adjustTrove(params, undefined, { gasPrice: 0 })
      );
    }
  }

  async closeTrove(userAddress: string, sfStablecoin: SfStablecoin, trove: Trove) {
    const total = await sfStablecoin.getTotal();

    if (total.collateralRatioIsBelowCritical(this.price)) {
      // Cannot close Trove during recovery mode
      console.log("// Skipping closeTrove() in recovery mode");
      return;
    }

    await this.sendDebtTokenFromFunder(userAddress, trove.netDebt);

    console.log(`[${shortenAddress(userAddress)}] closeTrove()`);

    await this.gasHistograms.closeTrove.expectSuccess(() =>
      sfStablecoin.send.closeTrove({ gasPrice: 0 })
    );
  }

  async redeemRandomAmount(userAddress: string, sfStablecoin: SfStablecoin) {
    const total = await sfStablecoin.getTotal();

    if (total.collateralRatioIsBelowMinimum(this.price)) {
      console.log("// Skipping redeemDebtToken() when TCR < MCR");
      return;
    }

    const amount = benford(10000);
    await this.sendDebtTokenFromFunder(userAddress, amount);

    console.log(`[${shortenAddress(userAddress)}] redeemDebtToken(${amount})`);

    try {
      await this.gasHistograms.redeemDebtToken.expectSuccess(() =>
        sfStablecoin.send.redeemDebtToken(amount, undefined, { gasPrice: 0 })
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("amount too low to redeem")) {
        console.log("// amount too low to redeem");
      } else {
        throw error;
      }
    }
  }

  async depositRandomAmountInStabilityPool(userAddress: string, sfStablecoin: SfStablecoin) {
    const amount = benford(20000);

    await this.sendDebtTokenFromFunder(userAddress, amount);

    console.log(`[${shortenAddress(userAddress)}] depositDebtTokenInStabilityPool(${amount})`);

    await this.gasHistograms.depositDebtTokenInStabilityPool.expectSuccess(() =>
      sfStablecoin.send.depositDebtTokenInStabilityPool(amount, this.frontendAddress, {
        gasPrice: 0
      })
    );
  }

  async withdrawRandomAmountFromStabilityPool(
    userAddress: string,
    sfStablecoin: SfStablecoin,
    deposit: StabilityDeposit
  ) {
    const [lastTrove] = await sfStablecoin.getTroves({
      first: 1,
      sortedBy: "ascendingCollateralRatio"
    });

    const amount = deposit.currentDebtToken.mul(1.1 * Math.random()).add(10 * Math.random());

    const cannotWithdraw = (amount: Decimal) =>
      amount.nonZero && lastTrove.collateralRatioIsBelowMinimum(this.price);

    if (cannotWithdraw(amount)) {
      console.log(
        `// [${shortenAddress(userAddress)}] ` +
          `withdrawDebtTokenFromStabilityPool(${amount}) expected to fail`
      );

      await this.gasHistograms.withdrawDebtTokenFromStabilityPool.expectFailure(() =>
        sfStablecoin.withdrawDebtTokenFromStabilityPool(amount, { gasPrice: 0 })
      );
    } else {
      console.log(`[${shortenAddress(userAddress)}] withdrawDebtTokenFromStabilityPool(${amount})`);

      await this.gasHistograms.withdrawDebtTokenFromStabilityPool.expectSuccess(() =>
        sfStablecoin.send.withdrawDebtTokenFromStabilityPool(amount, { gasPrice: 0 })
      );
    }
  }

  async stakeRandomAmount(userAddress: string, sfStablecoin: SfStablecoin) {
    const protocolTokenBalance = await this.funderSfStablecoin.getProtocolTokenBalance();
    const amount = protocolTokenBalance.mul(Math.random() / 2);

    await this.funderSfStablecoin.sendProtocolToken(userAddress, amount);

    if (amount.eq(0)) {
      console.log(
        `// [${shortenAddress(userAddress)}] stakeProtocolToken(${amount}) expected to fail`
      );

      await this.gasHistograms.stakeProtocolToken.expectFailure(() =>
        sfStablecoin.stakeProtocolToken(amount, { gasPrice: 0 })
      );
    } else {
      console.log(`[${shortenAddress(userAddress)}] stakeProtocolToken(${amount})`);

      await this.gasHistograms.stakeProtocolToken.expectSuccess(() =>
        sfStablecoin.send.stakeProtocolToken(amount, { gasPrice: 0 })
      );
    }
  }

  async unstakeRandomAmount(
    userAddress: string,
    sfStablecoin: SfStablecoin,
    stake: ProtocolTokenStake
  ) {
    const amount = stake.stakedProtocolToken.mul(1.1 * Math.random()).add(10 * Math.random());

    console.log(`[${shortenAddress(userAddress)}] unstakeProtocolToken(${amount})`);

    await this.gasHistograms.unstakeProtocolToken.expectSuccess(() =>
      sfStablecoin.send.unstakeProtocolToken(amount, { gasPrice: 0 })
    );
  }

  async sweepDebtToken(sfStablecoin: SfStablecoin) {
    const debtTokenBalance = await sfStablecoin.getDebtTokenBalance();

    if (debtTokenBalance.nonZero) {
      await sfStablecoin.sendDebtToken(this.funderAddress, debtTokenBalance, { gasPrice: 0 });
    }
  }

  async sweepProtocolToken(sfStablecoin: SfStablecoin) {
    const protocolTokenBalance = await sfStablecoin.getProtocolTokenBalance();

    if (protocolTokenBalance.nonZero) {
      await sfStablecoin.sendProtocolToken(this.funderAddress, protocolTokenBalance, {
        gasPrice: 0
      });
    }
  }

  summarizeGasStats(): string {
    return Object.entries(this.gasHistograms)
      .map(([name, histo]) => {
        const results = histo.getResults();

        return (
          `${name},outOfGas,${histo.outOfGasFailures}\n` +
          `${name},failure,${histo.expectedFailures}\n` +
          results
            .map(([intervalMin, frequency]) => `${name},success,${frequency},${intervalMin}\n`)
            .join("")
        );
      })
      .join("");
  }
}
