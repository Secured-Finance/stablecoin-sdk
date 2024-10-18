import { Button } from "theme-ui";

import { Decimal, ProtocolTokenStakeChange } from "@secured-finance/lib-base";

import { useLiquity } from "../../hooks/LiquityContext";
import { useTransactionFunction } from "../Transaction";

type StakingActionProps = React.PropsWithChildren<{
  change: ProtocolTokenStakeChange<Decimal>;
}>;

export const StakingManagerAction: React.FC<StakingActionProps> = ({ change, children }) => {
  const { liquity } = useLiquity();

  const [sendTransaction] = useTransactionFunction(
    "stake",
    change.stakeProtocolToken
      ? liquity.send.stakeProtocolToken.bind(liquity.send, change.stakeProtocolToken)
      : liquity.send.unstakeProtocolToken.bind(liquity.send, change.unstakeProtocolToken)
  );

  return <Button onClick={sendTransaction}>{children}</Button>;
};
