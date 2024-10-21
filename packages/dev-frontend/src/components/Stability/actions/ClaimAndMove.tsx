import React from "react";
import { Button } from "theme-ui";
import { useSfStablecoin } from "../../../hooks/SfStablecoinContext";
import { useTransactionFunction } from "../../Transaction";

type ClaimAndMoveProps = React.PropsWithChildren<{
  disabled?: boolean;
}>;

export const ClaimAndMove: React.FC<ClaimAndMoveProps> = ({ disabled, children }) => {
  const { sfStablecoin } = useSfStablecoin();

  const [sendTransaction] = useTransactionFunction(
    "stability-deposit",
    sfStablecoin.send.transferCollateralGainToTrove.bind(sfStablecoin.send)
  );

  return (
    <Button
      variant="outline"
      sx={{ mt: 3, width: "100%" }}
      onClick={sendTransaction}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};
