import React, { useEffect } from "react";
import { Button, Flex, Spinner } from "theme-ui";

import { SfStablecoinStoreState } from "@secured-finance/stablecoin-lib-base";
import { useSfStablecoinSelector } from "@secured-finance/stablecoin-lib-react";

import { useSfStablecoin } from "../hooks/SfStablecoinContext";
import { CURRENCY } from "../strings";

import { Transaction, useMyTransactionState } from "./Transaction";
import { useTroveView } from "./Trove/context/TroveViewContext";

const select = ({ collateralSurplusBalance }: SfStablecoinStoreState) => ({
  collateralSurplusBalance
});

export const CollateralSurplusAction: React.FC = () => {
  const { collateralSurplusBalance } = useSfStablecoinSelector(select);
  const {
    sfStablecoin: { send: sfStablecoin }
  } = useSfStablecoin();

  const myTransactionId = "claim-coll-surplus";
  const myTransactionState = useMyTransactionState(myTransactionId);

  const { dispatchEvent } = useTroveView();

  useEffect(() => {
    if (myTransactionState.type === "confirmedOneShot") {
      dispatchEvent("TROVE_SURPLUS_COLLATERAL_CLAIMED");
    }
  }, [myTransactionState.type, dispatchEvent]);

  return myTransactionState.type === "waitingForApproval" ? (
    <Flex variant="layout.actions">
      <Button disabled sx={{ mx: 2 }}>
        <Spinner sx={{ mr: 2, color: "white" }} size={20} />
        Waiting for your approval
      </Button>
    </Flex>
  ) : myTransactionState.type !== "waitingForConfirmation" &&
    myTransactionState.type !== "confirmed" ? (
    <Flex variant="layout.actions">
      <Transaction
        id={myTransactionId}
        send={sfStablecoin.claimCollateralSurplus.bind(sfStablecoin, undefined)}
      >
        <Button sx={{ mx: 2 }}>
          Claim {collateralSurplusBalance.prettify()} {CURRENCY}
        </Button>
      </Transaction>
    </Flex>
  ) : null;
};
