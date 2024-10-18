import { Button } from "theme-ui";

import { LiquityStoreState } from "@secured-finance/lib-base";
import { useLiquitySelector } from "@secured-finance/lib-react";

import { useLiquity } from "../../hooks/LiquityContext";
import { useTransactionFunction } from "../Transaction";

const selectProtocolTokenStake = ({ protocolTokenStake }: LiquityStoreState) => protocolTokenStake;

export const StakingGainsAction: React.FC = () => {
  const { liquity } = useLiquity();
  const { collateralGain, debtTokenGain } = useLiquitySelector(selectProtocolTokenStake);

  const [sendTransaction] = useTransactionFunction(
    "stake",
    liquity.send.withdrawGainsFromStaking.bind(liquity.send)
  );

  return (
    <Button onClick={sendTransaction} disabled={collateralGain.isZero && debtTokenGain.isZero}>
      Claim gains
    </Button>
  );
};
