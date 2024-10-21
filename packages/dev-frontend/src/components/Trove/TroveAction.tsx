import { Button } from "theme-ui";

import { Decimal, TroveChange } from "@secured-finance/lib-base";

import { useSfStablecoin } from "../../hooks/SfStablecoinContext";
import { useTransactionFunction } from "../Transaction";

type TroveActionProps = React.PropsWithChildren<{
  transactionId: string;
  change: Exclude<TroveChange<Decimal>, { type: "invalidCreation" }>;
  maxBorrowingRate: Decimal;
  borrowingFeeDecayToleranceMinutes: number;
}>;

export const TroveAction: React.FC<TroveActionProps> = ({
  children,
  transactionId,
  change,
  maxBorrowingRate,
  borrowingFeeDecayToleranceMinutes
}) => {
  const { sfStablecoin } = useSfStablecoin();

  const [sendTransaction] = useTransactionFunction(
    transactionId,
    change.type === "creation"
      ? sfStablecoin.send.openTrove.bind(sfStablecoin.send, change.params, {
          maxBorrowingRate,
          borrowingFeeDecayToleranceMinutes
        })
      : change.type === "closure"
      ? sfStablecoin.send.closeTrove.bind(sfStablecoin.send)
      : sfStablecoin.send.adjustTrove.bind(sfStablecoin.send, change.params, {
          maxBorrowingRate,
          borrowingFeeDecayToleranceMinutes
        })
  );

  return <Button onClick={sendTransaction}>{children}</Button>;
};
