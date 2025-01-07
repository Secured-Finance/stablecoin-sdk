import fs from "fs";

import {
  Decimal,
  Difference,
  MINIMUM_DEBT,
  Trove,
  TroveWithPendingRedistribution
} from "@secured-finance/stablecoin-lib-base";

import { Fixture } from "../fixture";
import { deployer, funder, provider, subgraph } from "../globals";

import {
  checkPoolBalances,
  checkSubgraph,
  checkTroveOrdering,
  connectUsers,
  createRandomWallets,
  getListOfTrovesBeforeRedistribution,
  shortenAddress
} from "../utils";

export interface ChaosParams {
  rounds: number;
  users: number;
  subgraph: boolean;
}

export const chaos = async ({
  rounds: numberOfRounds,
  users: numberOfUsers,
  subgraph: shouldCheckSubgraph
}: ChaosParams) => {
  const [frontend, ...randomUsers] = createRandomWallets(numberOfUsers + 1, provider);

  const [deployerSfStablecoin, funderSfStablecoin, frontendSfStablecoin, ...randomLiquities] =
    await connectUsers([deployer, funder, frontend, ...randomUsers]);

  const fixture = await Fixture.setup(
    deployerSfStablecoin,
    funder,
    funderSfStablecoin,
    frontend.address,
    frontendSfStablecoin
  );

  let previousListOfTroves: TroveWithPendingRedistribution[] | undefined = undefined;

  console.log();
  console.log("// Keys");
  console.log(`[frontend]: ${frontend.privateKey}`);
  randomUsers.forEach(user => console.log(`[${shortenAddress(user.address)}]: ${user.privateKey}`));

  for (let i = 1; i <= numberOfRounds; ++i) {
    console.log();
    console.log(`// Round #${i}`);

    const price = await fixture.setRandomPrice();
    await fixture.liquidateRandomNumberOfTroves(price);

    for (let i = 0; i < randomUsers.length; ++i) {
      const user = randomUsers[i];
      const sfStablecoin = randomLiquities[i];

      const x = Math.random();

      if (x < 0.5) {
        const trove = await sfStablecoin.getTrove();

        if (trove.isEmpty) {
          await fixture.openRandomTrove(user.address, sfStablecoin);
        } else {
          if (x < 0.4) {
            await fixture.randomlyAdjustTrove(user.address, sfStablecoin, trove);
          } else {
            await fixture.closeTrove(user.address, sfStablecoin, trove);
          }
        }
      } else if (x < 0.7) {
        const deposit = await sfStablecoin.getStabilityDeposit();

        if (deposit.initialDebtToken.isZero || x < 0.6) {
          await fixture.depositRandomAmountInStabilityPool(user.address, sfStablecoin);
        } else {
          await fixture.withdrawRandomAmountFromStabilityPool(user.address, sfStablecoin, deposit);
        }
      } else if (x < 0.9) {
        const stake = await sfStablecoin.getProtocolTokenStake();

        if (stake.stakedProtocolToken.isZero || x < 0.8) {
          await fixture.stakeRandomAmount(user.address, sfStablecoin);
        } else {
          await fixture.unstakeRandomAmount(user.address, sfStablecoin, stake);
        }
      } else {
        await fixture.redeemRandomAmount(user.address, sfStablecoin);
      }

      // await fixture.sweepDebtToken(sfStablecoin);
      await fixture.sweepProtocolToken(sfStablecoin);

      const listOfTroves = await getListOfTrovesBeforeRedistribution(deployerSfStablecoin);
      const totalRedistributed = await deployerSfStablecoin.getTotalRedistributed();

      checkTroveOrdering(listOfTroves, totalRedistributed, price, previousListOfTroves);
      await checkPoolBalances(deployerSfStablecoin, listOfTroves, totalRedistributed);

      previousListOfTroves = listOfTroves;
    }

    if (shouldCheckSubgraph) {
      const blockNumber = await provider.getBlockNumber();
      await subgraph.waitForBlock(blockNumber);
      await checkSubgraph(subgraph, deployerSfStablecoin);
    }
  }

  fs.appendFileSync("chaos.csv", fixture.summarizeGasStats());
};

export const order = async () => {
  const [deployerSfStablecoin, funderSfStablecoin] = await connectUsers([deployer, funder]);

  const initialPrice = await deployerSfStablecoin.getPrice();
  // let initialNumberOfTroves = await funderSfStablecoin.getNumberOfTroves();

  let [firstTrove] = await funderSfStablecoin.getTroves({
    first: 1,
    sortedBy: "descendingCollateralRatio"
  });

  if (firstTrove.ownerAddress !== funder.address) {
    const funderTrove = await funderSfStablecoin.getTrove();

    const targetCollateralRatio = Decimal.max(
      firstTrove.collateralRatio(initialPrice).add(0.00001),
      1.51
    );

    if (funderTrove.isEmpty) {
      const targetTrove = new Trove(
        MINIMUM_DEBT.mulDiv(targetCollateralRatio, initialPrice),
        MINIMUM_DEBT
      );

      const fees = await funderSfStablecoin.getFees();

      await funderSfStablecoin.openTrove(Trove.recreate(targetTrove, fees.borrowingRate()));
    } else {
      const targetTrove = funderTrove.setCollateral(
        funderTrove.debt.mulDiv(targetCollateralRatio, initialPrice)
      );

      await funderSfStablecoin.adjustTrove(funderTrove.adjustTo(targetTrove));
    }
  }

  [firstTrove] = await funderSfStablecoin.getTroves({
    first: 1,
    sortedBy: "descendingCollateralRatio"
  });

  if (firstTrove.ownerAddress !== funder.address) {
    throw new Error("didn't manage to hoist Funder's Trove to head of SortedTroves");
  }

  await deployerSfStablecoin.setPrice(0.001);

  let numberOfTroves: number;
  while ((numberOfTroves = await funderSfStablecoin.getNumberOfTroves()) > 1) {
    const numberOfTrovesToLiquidate = numberOfTroves > 10 ? 10 : numberOfTroves - 1;

    console.log(`${numberOfTroves} Troves left.`);
    await funderSfStablecoin.liquidateUpTo(numberOfTrovesToLiquidate);
  }

  await deployerSfStablecoin.setPrice(initialPrice);

  if ((await funderSfStablecoin.getNumberOfTroves()) !== 1) {
    throw new Error("didn't manage to liquidate every Trove");
  }

  const funderTrove = await funderSfStablecoin.getTrove();
  const total = await funderSfStablecoin.getTotal();

  const collateralDifference = Difference.between(total.collateral, funderTrove.collateral);
  const debtDifference = Difference.between(total.debt, funderTrove.debt);

  console.log();
  console.log("Discrepancies:");
  console.log(`Collateral: ${collateralDifference}`);
  console.log(`Debt: ${debtDifference}`);
};
