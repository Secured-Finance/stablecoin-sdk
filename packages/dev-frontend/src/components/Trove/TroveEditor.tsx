import React from "react";
import { Box, Card, Heading } from "theme-ui";

import {
  Decimal,
  Decimalish,
  Difference,
  LIQUIDATION_RESERVE,
  Percent,
  SfStablecoinStoreState,
  Trove
} from "@secured-finance/stablecoin-lib-base";
import { useSfStablecoinSelector } from "@secured-finance/stablecoin-lib-react";

import { COIN, CURRENCY } from "../../strings";

import { InfoIcon } from "../InfoIcon";
import { LoadingOverlay } from "../LoadingOverlay";
import { CollateralRatio } from "./CollateralRatio";
import { StaticRow } from "./Editor";

type TroveEditorProps = React.PropsWithChildren<{
  original: Trove;
  edited: Trove;
  fee: Decimal;
  borrowingRate: Decimal;
  changePending: boolean;
  dispatch: (
    action: { type: "setCollateral" | "setDebt"; newValue: Decimalish } | { type: "revert" }
  ) => void;
}>;

const select = ({ price }: SfStablecoinStoreState) => ({ price });

// XXX Only used for closing Troves now
export const TroveEditor: React.FC<TroveEditorProps> = ({
  children,
  original,
  edited,
  fee,
  borrowingRate,
  changePending
}) => {
  const { price } = useSfStablecoinSelector(select);

  const feePct = new Percent(borrowingRate);

  const originalCollateralRatio = !original.isEmpty ? original.collateralRatio(price) : undefined;
  const collateralRatio = !edited.isEmpty ? edited.collateralRatio(price) : undefined;
  const collateralRatioChange = Difference.between(collateralRatio, originalCollateralRatio);

  return (
    <Card>
      <Heading>Trove</Heading>

      <Box sx={{ p: [2, 3] }}>
        <StaticRow
          label="Collateral"
          inputId="trove-collateral"
          amount={edited.collateral.prettify(4)}
          unit={CURRENCY}
        />

        <StaticRow label="Debt" inputId="trove-debt" amount={edited.debt.prettify()} unit={COIN} />

        {original.isEmpty && (
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
                    liquidated. The amount increases your debt and is refunded if you close your
                    Trove by fully paying off its net debt.
                  </Card>
                }
              />
            }
          />
        )}

        <StaticRow
          label="Borrowing Fee"
          inputId="trove-borrowing-fee"
          amount={fee.toString(2)}
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

        <CollateralRatio value={collateralRatio} change={collateralRatioChange} />

        {children}
      </Box>

      {changePending && <LoadingOverlay />}
    </Card>
  );
};
