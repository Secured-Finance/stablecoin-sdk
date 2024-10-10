import React, { useState } from "react";
import { Box, Button, Card, Heading } from "theme-ui";

import {
  Decimal,
  Decimalish,
  Difference,
  LiquityStoreState,
  StabilityDeposit
} from "@secured-finance/lib-base";

import { useLiquitySelector } from "@secured-finance/lib-react";

import { COIN, GT } from "../../strings";

import { Icon } from "../Icon";
import { InfoIcon } from "../InfoIcon";
import { LoadingOverlay } from "../LoadingOverlay";
import { EditableRow, StaticRow } from "../Trove/Editor";

const select = ({ debtTokenBalance, debtTokenInStabilityPool }: LiquityStoreState) => ({
  debtTokenBalance,
  debtTokenInStabilityPool
});

type StabilityDepositEditorProps = React.PropsWithChildren<{
  originalDeposit: StabilityDeposit;
  editedDebtToken: Decimal;
  changePending: boolean;
  dispatch: (action: { type: "setDeposit"; newValue: Decimalish } | { type: "revert" }) => void;
}>;

export const StabilityDepositEditor: React.FC<StabilityDepositEditorProps> = ({
  originalDeposit,
  editedDebtToken,
  changePending,
  dispatch,
  children
}) => {
  const { debtTokenBalance, debtTokenInStabilityPool } = useLiquitySelector(select);
  const editingState = useState<string>();

  const edited = !editedDebtToken.eq(originalDeposit.currentDebtToken);

  const maxAmount = originalDeposit.currentDebtToken.add(debtTokenBalance);
  const maxedOut = editedDebtToken.eq(maxAmount);

  const debtTokenInStabilityPoolAfterChange = debtTokenInStabilityPool
    .sub(originalDeposit.currentDebtToken)
    .add(editedDebtToken);

  const originalPoolShare = originalDeposit.currentDebtToken.mulDiv(100, debtTokenInStabilityPool);
  const newPoolShare = editedDebtToken.mulDiv(100, debtTokenInStabilityPoolAfterChange);
  const poolShareChange =
    originalDeposit.currentDebtToken.nonZero &&
    Difference.between(newPoolShare, originalPoolShare).nonZero;

  return (
    <Card>
      <Heading>
        Stability Pool
        {edited && !changePending && (
          <Button
            variant="titleIcon"
            sx={{ ":enabled:hover": { color: "danger" } }}
            onClick={() => dispatch({ type: "revert" })}
          >
            <Icon name="history" size="lg" />
          </Button>
        )}
      </Heading>

      <Box sx={{ p: [2, 3] }}>
        <EditableRow
          label="Deposit"
          inputId="deposit-lqty"
          amount={editedDebtToken.prettify()}
          maxAmount={maxAmount.toString()}
          maxedOut={maxedOut}
          unit={COIN}
          {...{ editingState }}
          editedAmount={editedDebtToken.toString(2)}
          setEditedAmount={newValue => dispatch({ type: "setDeposit", newValue })}
        />

        {newPoolShare.infinite ? (
          <StaticRow label="Pool share" inputId="deposit-share" amount="N/A" />
        ) : (
          <StaticRow
            label="Pool share"
            inputId="deposit-share"
            amount={newPoolShare.prettify(4)}
            pendingAmount={poolShareChange?.prettify(4).concat("%")}
            pendingColor={poolShareChange?.positive ? "success" : "danger"}
            unit="%"
          />
        )}

        {!originalDeposit.isEmpty && (
          <>
            <StaticRow
              label="Liquidation gain"
              inputId="deposit-gain"
              amount={originalDeposit.collateralGain.prettify(4)}
              color={originalDeposit.collateralGain.nonZero && "success"}
              unit="ETH"
            />

            <StaticRow
              label="Reward"
              inputId="deposit-reward"
              amount={originalDeposit.lqtyReward.prettify()}
              color={originalDeposit.lqtyReward.nonZero && "success"}
              unit={GT}
              infoIcon={
                <InfoIcon
                  tooltip={
                    <Card variant="tooltip" sx={{ width: "240px" }}>
                      Although the LQTY rewards accrue every minute, the value on the UI only updates
                      when a user transacts with the Stability Pool. Therefore you may receive more
                      rewards than is displayed when you claim or adjust your deposit.
                    </Card>
                  }
                />
              }
            />
          </>
        )}
        {children}
      </Box>

      {changePending && <LoadingOverlay />}
    </Card>
  );
};
