import React, { useState } from "react";
import { Box, Button, Card, Heading } from "theme-ui";

import {
  Decimal,
  Decimalish,
  Difference,
  ProtocolTokenStake,
  SfStablecoinStoreState
} from "@secured-finance/stablecoin-lib-base";
import { useSfStablecoinSelector } from "@secured-finance/stablecoin-lib-react";

import { COIN, CURRENCY, GT } from "../../strings";

import { Icon } from "../Icon";
import { LoadingOverlay } from "../LoadingOverlay";
import { EditableRow, StaticRow } from "../Trove/Editor";

import { useStakingView } from "./context/StakingViewContext";

const select = ({ protocolTokenBalance, totalStakedProtocolToken }: SfStablecoinStoreState) => ({
  protocolTokenBalance,
  totalStakedProtocolToken
});

type StakingEditorProps = React.PropsWithChildren<{
  title: string;
  originalStake: ProtocolTokenStake;
  editedProtocolToken: Decimal;
  dispatch: (action: { type: "setStake"; newValue: Decimalish } | { type: "revert" }) => void;
}>;

export const StakingEditor: React.FC<StakingEditorProps> = ({
  children,
  title,
  originalStake,
  editedProtocolToken,
  dispatch
}) => {
  const { protocolTokenBalance, totalStakedProtocolToken } = useSfStablecoinSelector(select);
  const { changePending } = useStakingView();
  const editingState = useState<string>();

  const edited = !editedProtocolToken.eq(originalStake.stakedProtocolToken);

  const maxAmount = originalStake.stakedProtocolToken.add(protocolTokenBalance);
  const maxedOut = editedProtocolToken.eq(maxAmount);

  const totalStakedProtocolTokenAfterChange = totalStakedProtocolToken
    .sub(originalStake.stakedProtocolToken)
    .add(editedProtocolToken);

  const originalPoolShare = originalStake.stakedProtocolToken.mulDiv(100, totalStakedProtocolToken);
  const newPoolShare = editedProtocolToken.mulDiv(100, totalStakedProtocolTokenAfterChange);
  const poolShareChange =
    originalStake.stakedProtocolToken.nonZero &&
    Difference.between(newPoolShare, originalPoolShare).nonZero;

  return (
    <Card>
      <Heading>
        {title}
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
          label="Stake"
          inputId="stake-lqty"
          amount={editedProtocolToken.prettify()}
          maxAmount={maxAmount.toString()}
          maxedOut={maxedOut}
          unit={GT}
          {...{ editingState }}
          editedAmount={editedProtocolToken.toString(2)}
          setEditedAmount={newValue => dispatch({ type: "setStake", newValue })}
        />

        {newPoolShare.infinite ? (
          <StaticRow label="Pool share" inputId="stake-share" amount="N/A" />
        ) : (
          <StaticRow
            label="Pool share"
            inputId="stake-share"
            amount={newPoolShare.prettify(4)}
            pendingAmount={poolShareChange?.prettify(4).concat("%")}
            pendingColor={poolShareChange?.positive ? "success" : "danger"}
            unit="%"
          />
        )}

        {!originalStake.isEmpty && (
          <>
            <StaticRow
              label="Redemption gain"
              inputId="stake-gain-eth"
              amount={originalStake.collateralGain.prettify(4)}
              color={originalStake.collateralGain.nonZero && "success"}
              unit={CURRENCY}
            />

            <StaticRow
              label="Issuance gain"
              inputId="stake-gain-debt-token"
              amount={originalStake.debtTokenGain.prettify()}
              color={originalStake.debtTokenGain.nonZero && "success"}
              unit={COIN}
            />
          </>
        )}

        {children}
      </Box>

      {changePending && <LoadingOverlay />}
    </Card>
  );
};
