import {
  Decimal,
  MINIMUM_NET_DEBT,
  Percent,
  SfStablecoinStoreState
} from "@secured-finance/stablecoin-lib-base";
import { useSfStablecoinSelector } from "@secured-finance/stablecoin-lib-react";
import React, { useEffect, useState } from "react";
import { Box, Button, Card, Flex, Heading, Spinner } from "theme-ui";
import { useSfStablecoin } from "../../hooks/SfStablecoinContext";
import { COIN } from "../../strings";
import { ActionDescription, Amount } from "../ActionDescription";
import { ErrorDescription } from "../ErrorDescription";
import { InfoIcon } from "../InfoIcon";
import { LoadingOverlay } from "../LoadingOverlay";
import { useMyTransactionState, useTransactionFunction } from "../Transaction";
import { EditableRow, StaticRow } from "../Trove/Editor";

const transactionId = "redeem";

const selector = (state: SfStablecoinStoreState) => {
  const { fees, debtTokenBalance, price } = state;
  return {
    fees,
    debtTokenBalance,
    price
  };
};

export const Redemption: React.FC = () => {
  const { fees, debtTokenBalance, price } = useSfStablecoinSelector(selector);
  const { sfStablecoin } = useSfStablecoin();
  const [debtToken, setDebtToken] = useState<Decimal>(Decimal.from(0));
  const [estimatedDebtToken, setEstimatedDebtToken] = useState<Decimal>(Decimal.from(0));
  const [changePending, setChangePending] = useState<boolean>(false);
  const [hintsPending, setHintsPending] = useState<boolean>(false);
  const editingState = useState<string>();
  const [sendTransaction] = useTransactionFunction(
    transactionId,
    sfStablecoin.send.redeemDebtToken.bind(sfStablecoin.send, debtToken, undefined)
  );

  const maxAmount = debtTokenBalance;
  const maxedOut = debtToken.eq(maxAmount);
  const redemptionRate = fees.redemptionRate();
  const feePct = new Percent(redemptionRate);
  const fee = debtToken.mul(redemptionRate).div(price);

  const [isValid, description] = debtToken.gt(debtTokenBalance)
    ? [
        false,
        <ErrorDescription key={0}>
          The amount you&apos;re trying to redeem exceeds your balance by{" "}
          {debtToken.sub(debtTokenBalance).prettify(2)} {COIN}.
        </ErrorDescription>
      ]
    : !hintsPending && !estimatedDebtToken.eq(debtToken) && estimatedDebtToken.isZero
    ? [
        false,
        <ErrorDescription key={0}>
          Redemption is not possible with the entered amount because the Trove with the lowest
          collateral ratio eligible for redemption does not hold enough {COIN}. Please try a higher
          amount than {MINIMUM_NET_DEBT.prettify(0)} {COIN}.
        </ErrorDescription>
      ]
    : !hintsPending && !estimatedDebtToken.eq(debtToken) && estimatedDebtToken.nonZero
    ? [
        true,
        <ActionDescription key={0}>
          <>
            The entered amount has been adjusted because the Trove with the lowest collateral ratio
            eligible for redemption does not hold enough {COIN}. You will redeem.{" "}
            <Amount>
              {estimatedDebtToken.prettify()} {COIN}
            </Amount>{" "}
            and receive <Amount>{estimatedDebtToken.div(price).sub(fee).prettify()} tFIL</Amount> in
            return.
          </>
        </ActionDescription>
      ]
    : !hintsPending && debtToken.nonZero
    ? [
        true,
        <ActionDescription key={0}>
          <>
            You will redeem{" "}
            <Amount>
              {debtToken.prettify()} {COIN}
            </Amount>{" "}
            and receive <Amount>{debtToken.div(price).sub(fee).prettify()} tFIL</Amount> in return.
          </>
        </ActionDescription>
      ]
    : [false, undefined];

  const myTransactionState = useMyTransactionState(transactionId);

  useEffect(() => {
    if (
      myTransactionState.type === "waitingForApproval" ||
      myTransactionState.type === "waitingForConfirmation"
    ) {
      setChangePending(true);
    } else if (myTransactionState.type === "failed") {
      setChangePending(false);
    } else {
      setChangePending(false);
      setDebtToken(Decimal.from(0));
    }
  }, [myTransactionState.type, setChangePending]);

  useEffect(() => {
    if (debtToken.isZero) {
      return;
    }

    setHintsPending(true);
    const timeoutId = setTimeout(async () => {
      const hints = await sfStablecoin.findRedemptionHints(debtToken);
      setEstimatedDebtToken(hints[0]);
      setHintsPending(false);
      console.log("estimatedDebtToken:", hints[0].prettify(2));
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      setHintsPending(false);
    };
  }, [debtToken, sfStablecoin]);

  return (
    <Card>
      <Heading>Redemption</Heading>
      <Box sx={{ p: [2, 3] }}>
        <EditableRow
          label="Redeem"
          inputId="redeem-scr"
          amount={debtToken.prettify()}
          maxAmount={maxAmount.toString()}
          maxedOut={maxedOut}
          unit={COIN}
          {...{ editingState }}
          editedAmount={debtToken.toString(2)}
          setEditedAmount={amount => setDebtToken(Decimal.from(amount))}
        />
        <div className="flex flex-col gap-3 px-3">
          <StaticRow
            label="Redemption Fee"
            inputId="redemption-fee"
            amount={fee.prettify(2)}
            pendingAmount={feePct.toString(2)}
            unit="tFIL"
            infoIcon={
              <InfoIcon
                tooltip={
                  <Card variant="tooltip" sx={{ width: "240px" }}>
                    The Redemption Fee is charged as a percentage of the redeemed tFIL. The
                    Redemption Fee depends on {COIN} redemption volumes and is 0.5% at minimum.
                  </Card>
                }
              />
            }
          />
        </div>
        {description}
        <Flex variant="layout.actions">
          {hintsPending ? (
            <Button disabled>
              <Spinner sx={{ mx: 18, color: "white" }} size={24} />
            </Button>
          ) : isValid ? (
            <Button onClick={sendTransaction}>Confirm</Button>
          ) : (
            <Button disabled>Confirm</Button>
          )}
        </Flex>
      </Box>
      {changePending && <LoadingOverlay />}
    </Card>
  );
};
