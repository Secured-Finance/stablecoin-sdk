import React from "react";

import { Decimal, StabilityDeposit, StabilityDepositChange } from "@secured-finance/lib-base";

import { COIN, CURRENCY, GT } from "../../strings";
import { ActionDescription, Amount } from "../ActionDescription";

type StabilityActionDescriptionProps = {
  originalDeposit: StabilityDeposit;
  change: StabilityDepositChange<Decimal>;
};

export const StabilityActionDescription: React.FC<StabilityActionDescriptionProps> = ({
  originalDeposit,
  change
}) => {
  const collateralGain = originalDeposit.collateralGain.nonZero?.prettify(4).concat(` ${CURRENCY}`);
  const lqtyReward = originalDeposit.lqtyReward.nonZero?.prettify().concat(" ", GT);

  return (
    <ActionDescription>
      {change.depositDebtToken ? (
        <>
          You are depositing{" "}
          <Amount>
            {change.depositDebtToken.prettify()} {COIN}
          </Amount>{" "}
          in the Stability Pool
        </>
      ) : (
        <>
          You are withdrawing{" "}
          <Amount>
            {change.withdrawDebtToken.prettify()} {COIN}
          </Amount>{" "}
          to your wallet
        </>
      )}
      {(collateralGain || lqtyReward) && (
        <>
          {" "}
          and claiming at least{" "}
          {collateralGain && lqtyReward ? (
            <>
              <Amount>{collateralGain}</Amount> and <Amount>{lqtyReward}</Amount>
            </>
          ) : (
            <Amount>{collateralGain ?? lqtyReward}</Amount>
          )}
        </>
      )}
      .
    </ActionDescription>
  );
};
