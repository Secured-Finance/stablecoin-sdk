import { Button } from "theme-ui";

import { Decimal, ProtocolTokenStakeChange } from "@secured-finance/stablecoin-lib-base";

import { useSfStablecoin } from "../../hooks/SfStablecoinContext";
import { useTransactionFunction } from "../Transaction";

type StakingActionProps = React.PropsWithChildren<{
  change: ProtocolTokenStakeChange<Decimal>;
}>;

export const StakingManagerAction: React.FC<StakingActionProps> = ({ change, children }) => {
  const { sfStablecoin } = useSfStablecoin();

  const [sendTransaction] = useTransactionFunction(
    "stake",
    change.stakeProtocolToken
      ? sfStablecoin.send.stakeProtocolToken.bind(sfStablecoin.send, change.stakeProtocolToken)
      : sfStablecoin.send.unstakeProtocolToken.bind(sfStablecoin.send, change.unstakeProtocolToken)
  );

  return <Button onClick={sendTransaction}>{children}</Button>;
};
