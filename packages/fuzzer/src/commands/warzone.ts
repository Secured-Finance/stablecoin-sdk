import { Wallet } from "@ethersproject/wallet";

import { Decimal, MINIMUM_DEBT, Trove } from "@secured-finance/stablecoin-lib-base";
import { EthersSfStablecoin } from "@secured-finance/stablecoin-lib-ethers";

import { deployer, funder, provider } from "../globals";

export interface WarzoneParams {
  troves: number;
}

export const warzone = async ({ troves: numberOfTroves }: WarzoneParams) => {
  const deployerSfStablecoin = await EthersSfStablecoin.connect(deployer);

  const price = await deployerSfStablecoin.getPrice();

  for (let i = 1; i <= numberOfTroves; ++i) {
    const user = Wallet.createRandom().connect(provider);
    const userAddress = await user.getAddress();
    const debt = MINIMUM_DEBT.add(99999 * Math.random());
    const collateral = debt.mulDiv(1.11 + 3 * Math.random(), price);

    const sfStablecoin = await EthersSfStablecoin.connect(user);

    await funder.sendTransaction({
      to: userAddress,
      value: Decimal.from(collateral).hex
    });

    const fees = await sfStablecoin.getFees();

    await sfStablecoin.openTrove(
      Trove.recreate(new Trove(collateral, debt), fees.borrowingRate()),
      { borrowingFeeDecayToleranceMinutes: 0 },
      { gasPrice: 0 }
    );

    if (i % 4 === 0) {
      const debtTokenBalance = await sfStablecoin.getDebtTokenBalance();
      await sfStablecoin.depositDebtTokenInStabilityPool(debtTokenBalance);
    }

    if (i % 10 === 0) {
      console.log(`Created ${i} Troves.`);
    }

    //await new Promise(resolve => setTimeout(resolve, 4000));
  }
};
