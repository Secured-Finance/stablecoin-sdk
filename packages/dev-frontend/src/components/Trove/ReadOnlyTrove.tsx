import { SfStablecoinStoreState } from "@secured-finance/stablecoin-lib-base";
import { useSfStablecoinSelector } from "@secured-finance/stablecoin-lib-react";
import React, { useCallback } from "react";
import { Box, Button, Card, Flex, Heading } from "theme-ui";
import { COIN, CURRENCY } from "../../strings";
import { Icon } from "../Icon";
import { CollateralRatio, CollateralRatioInfoBubble } from "./CollateralRatio";
import { DisabledEditableRow } from "./Editor";
import { useTroveView } from "./context/TroveViewContext";

const select = ({ trove, price }: SfStablecoinStoreState) => ({ trove, price });

export const ReadOnlyTrove: React.FC = () => {
  const { dispatchEvent } = useTroveView();
  const handleAdjustTrove = useCallback(() => {
    dispatchEvent("ADJUST_TROVE_PRESSED");
  }, [dispatchEvent]);
  const handleCloseTrove = useCallback(() => {
    dispatchEvent("CLOSE_TROVE_PRESSED");
  }, [dispatchEvent]);

  const { trove, price } = useSfStablecoinSelector(select);

  // console.log("READONLY TROVE", trove.collateral.prettify(4));
  return (
    <Card>
      <Heading>Trove</Heading>
      <Box sx={{ p: [2, 3] }}>
        <Box>
          <DisabledEditableRow
            label="Collateral"
            inputId="trove-collateral"
            amount={trove.collateral.prettify(4)}
            unit={CURRENCY}
          />

          <DisabledEditableRow
            label="Debt"
            inputId="trove-debt"
            amount={trove.debt.prettify()}
            unit={COIN}
          />

          <CollateralRatio value={trove.collateralRatio(price)} />
          <CollateralRatioInfoBubble value={trove.collateralRatio(price)} />
        </Box>

        <Flex variant="layout.actions">
          <Button variant="outline" onClick={handleCloseTrove}>
            Close Trove
          </Button>
          <Button onClick={handleAdjustTrove}>
            <Icon name="pen" size="sm" />
            &nbsp;Adjust
          </Button>
        </Flex>
      </Box>
    </Card>
  );
};
