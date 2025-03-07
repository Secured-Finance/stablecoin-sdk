/** @jsxImportSource theme-ui */
import {
  Decimal,
  LIQUIDATION_RESERVE,
  MINIMUM_NET_DEBT,
  Percent,
  SfStablecoinStoreState,
  Trove
} from "@secured-finance/stablecoin-lib-base";
import { useSfStablecoinSelector } from "@secured-finance/stablecoin-lib-react";
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Box, Button, Card, Flex, Heading, Spinner } from "theme-ui";

import { useStableTroveChange } from "../../hooks/useStableTroveChange";
import { COIN, CURRENCY } from "../../strings";
import { Icon } from "../Icon";
import { InfoBubble } from "../InfoBubble";
import { InfoIcon } from "../InfoIcon";
import { LoadingOverlay } from "../LoadingOverlay";
import { LearnMoreLink } from "../Tooltip";
import { useMyTransactionState } from "../Transaction";
import { CollateralRatio, CollateralRatioInfoBubble } from "./CollateralRatio";
import { EditableRow, StaticRow } from "./Editor";
import { ExpensiveTroveChangeWarning, GasEstimationState } from "./ExpensiveTroveChangeWarning";
import { TroveAction } from "./TroveAction";
import { useTroveView } from "./context/TroveViewContext";
import {
  selectForTroveChangeValidation,
  validateTroveChange
} from "./validation/validateTroveChange";

const selector = (state: SfStablecoinStoreState) => {
  const { fees, price, accountBalance } = state;
  return {
    fees,
    price,
    accountBalance,
    validationContext: selectForTroveChangeValidation(state)
  };
};

const EMPTY_TROVE = new Trove(Decimal.ZERO, Decimal.ZERO);
const TRANSACTION_ID = "trove-creation";
const GAS_ROOM_FIL = Decimal.from(0.1);

export const Opening: React.FC = () => {
  const { dispatchEvent } = useTroveView();
  const { fees, price, accountBalance, validationContext } = useSfStablecoinSelector(selector);
  const borrowingRate = fees.borrowingRate();
  const editingState = useState<string>();

  const [collateral, setCollateral] = useState<Decimal>(Decimal.ZERO);
  const [borrowAmount, setBorrowAmount] = useState<Decimal>(Decimal.ZERO);

  const maxBorrowingRate = borrowingRate.add(0.005);

  const fee = borrowAmount.mul(borrowingRate);
  const feePct = new Percent(borrowingRate);
  const totalDebt = borrowAmount.add(LIQUIDATION_RESERVE).add(fee);
  const isDirty = !collateral.isZero || !borrowAmount.isZero;
  const trove = isDirty ? new Trove(collateral, totalDebt) : EMPTY_TROVE;
  const maxCollateral = accountBalance.gt(GAS_ROOM_FIL)
    ? accountBalance.sub(GAS_ROOM_FIL)
    : Decimal.ZERO;
  const collateralMaxedOut = collateral.eq(maxCollateral);
  const collateralRatio =
    !collateral.isZero && !borrowAmount.isZero ? trove.collateralRatio(price) : undefined;

  const [troveChange, description] = validateTroveChange(
    EMPTY_TROVE,
    trove,
    borrowingRate,
    validationContext
  );

  const stableTroveChange = useStableTroveChange(troveChange);
  const [gasEstimationState, setGasEstimationState] = useState<GasEstimationState>({ type: "idle" });

  const transactionState = useMyTransactionState(TRANSACTION_ID);
  const isTransactionPending =
    transactionState.type === "waitingForApproval" ||
    transactionState.type === "waitingForConfirmation";

  const handleCancelPressed = useCallback(() => {
    dispatchEvent("CANCEL_ADJUST_TROVE_PRESSED");
  }, [dispatchEvent]);

  const reset = useCallback(() => {
    setCollateral(Decimal.ZERO);
    setBorrowAmount(Decimal.ZERO);
  }, []);

  useEffect(() => {
    if (!collateral.isZero && borrowAmount.isZero) {
      setBorrowAmount(MINIMUM_NET_DEBT);
    }
  }, [collateral, borrowAmount]);

  return (
    <Card>
      <Heading>
        Trove
        {isDirty && !isTransactionPending && (
          <Button variant="titleIcon" sx={{ ":enabled:hover": { color: "danger" } }} onClick={reset}>
            <Icon name="history" size="lg" />
          </Button>
        )}
      </Heading>

      <Box sx={{ p: [2, 3] }}>
        <EditableRow
          label="Collateral"
          inputId="trove-collateral"
          amount={collateral.prettify(4)}
          maxAmount={maxCollateral.toString()}
          maxedOut={collateralMaxedOut}
          editingState={editingState}
          unit={CURRENCY}
          editedAmount={collateral.toString(4)}
          setEditedAmount={(amount: string) => setCollateral(Decimal.from(amount))}
        />

        <EditableRow
          label="Borrow"
          inputId="trove-borrow-amount"
          amount={borrowAmount.prettify()}
          unit={COIN}
          editingState={editingState}
          editedAmount={borrowAmount.toString(2)}
          setEditedAmount={(amount: string) => setBorrowAmount(Decimal.from(amount))}
        />

        <StaticRow
          label="Liquidation Reserve"
          inputId="trove-liquidation-reserve"
          amount={`${LIQUIDATION_RESERVE}`}
          unit={COIN}
          infoIcon={
            <InfoIcon
              tooltip={
                <Card variant="tooltip" sx={{ width: "200px" }}>
                  An amount set aside to cover the liquidator’s gas costs if your Trove needs to be
                  liquidated. The amount increases your debt and is refunded if you close your Trove
                  by fully paying off its net debt.
                </Card>
              }
            />
          }
        />

        <StaticRow
          label="Borrowing Fee"
          inputId="trove-borrowing-fee"
          amount={fee.prettify(2)}
          pendingAmount={feePct.toString(2)}
          unit={COIN}
          infoIcon={
            <InfoIcon
              tooltip={
                <Card variant="tooltip" sx={{ width: "240px" }}>
                  This amount is deducted from the borrowed amount as a one-time fee. There are no
                  recurring fees for borrowing, which is thus interest-free.
                </Card>
              }
            />
          }
        />

        <StaticRow
          label="Total debt"
          inputId="trove-total-debt"
          amount={totalDebt.prettify(2)}
          unit={COIN}
          infoIcon={
            <InfoIcon
              tooltip={
                <Card variant="tooltip" sx={{ width: "240px" }}>
                  The total amount of USDFC your Trove will hold.{" "}
                  {isDirty && (
                    <>
                      You will need to repay {totalDebt.sub(LIQUIDATION_RESERVE).prettify(2)} USDFC
                      to reclaim your collateral ({LIQUIDATION_RESERVE.toString()} USDFC Liquidation
                      Reserve excluded).
                    </>
                  )}
                </Card>
              }
            />
          }
        />

        <CollateralRatio value={collateralRatio} />

        <InfoBubble>
          Keep your collateral ratio above the{" "}
          <Link sx={{ variant: "styles.a" }} to="/risky-troves">
            riskiest Troves
          </Link>{" "}
          to avoid being{" "}
          <LearnMoreLink link="https://docs.liquity.org/faq/lusd-redemptions#how-can-i-avoid-being-redeemed-against">
            redeemed.
          </LearnMoreLink>
        </InfoBubble>

        <CollateralRatioInfoBubble value={collateralRatio} />

        {description ?? (
          <InfoBubble>
            Start by entering the amount of {CURRENCY} you'd like to deposit as collateral.
          </InfoBubble>
        )}

        <ExpensiveTroveChangeWarning
          troveChange={stableTroveChange}
          maxBorrowingRate={maxBorrowingRate}
          borrowingFeeDecayToleranceMinutes={60}
          gasEstimationState={gasEstimationState}
          setGasEstimationState={setGasEstimationState}
        />

        <Flex variant="layout.actions">
          <Button variant="cancel" onClick={handleCancelPressed}>
            Cancel
          </Button>

          {gasEstimationState.type === "inProgress" ? (
            <Button disabled>
              <Spinner size={24} sx={{ color: "background" }} />
            </Button>
          ) : stableTroveChange ? (
            <TroveAction
              transactionId={TRANSACTION_ID}
              change={stableTroveChange}
              maxBorrowingRate={maxBorrowingRate}
              borrowingFeeDecayToleranceMinutes={60}
            >
              Confirm
            </TroveAction>
          ) : (
            <Button disabled>Confirm</Button>
          )}
        </Flex>
      </Box>
      {isTransactionPending && <LoadingOverlay />}
    </Card>
  );
};
