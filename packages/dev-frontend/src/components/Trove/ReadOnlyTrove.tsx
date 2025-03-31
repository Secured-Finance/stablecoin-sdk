import { AddressZero } from "@ethersproject/constants";
import { SfStablecoinStoreState } from "@secured-finance/stablecoin-lib-base";
import { useSfStablecoinSelector } from "@secured-finance/stablecoin-lib-react";
import React, { useCallback } from "react";
import { Box, Button, Card, Flex, Heading, Paragraph, Text } from "theme-ui";
import { COIN, CURRENCY } from "../../strings";
import { Icon } from "../Icon";
import { InfoIcon } from "../InfoIcon";
import { CollateralRatio, CollateralRatioInfoBubble } from "./CollateralRatio";
import { DisabledEditableRow } from "./Editor";
import { useTroveView } from "./context/TroveViewContext";

const select = ({ trove, price, debtInFront }: SfStablecoinStoreState) => ({
  trove,
  price,
  debtInFront
});

export const ReadOnlyTrove: React.FC = () => {
  const { dispatchEvent } = useTroveView();
  const handleAdjustTrove = useCallback(() => {
    dispatchEvent("ADJUST_TROVE_PRESSED");
  }, [dispatchEvent]);
  const handleCloseTrove = useCallback(() => {
    dispatchEvent("CLOSE_TROVE_PRESSED");
  }, [dispatchEvent]);

  const { trove, price, debtInFront } = useSfStablecoinSelector(select);

  // console.log("READONLY TROVE", trove.collateral.prettify(4));
  return (
    <Card>
      <Heading>
        Trove
        <Flex sx={{ justifyContent: "flex-end" }}>
          <Flex sx={{ mr: 2, flexDirection: "column" }}>
            <Flex sx={{ fontSize: 1, fontWeight: 300, lineHeight: 1.5 }}>
              Debt In Front{" "}
              <InfoIcon
                tooltip={
                  <Card variant="tooltip" sx={{ width: "240px" }}>
                    <Paragraph>
                      The <Text sx={{ fontWeight: "bold" }}>"Debt in front"</Text> represents the sum
                      of the {COIN} debt of all Troves with a lower collateral ratio than you.
                    </Paragraph>
                    <Paragraph>
                      Debt-in-front metric indicates the {COIN} amount to be redeemed before
                      affecting your Trove.
                    </Paragraph>
                  </Card>
                }
              ></InfoIcon>
            </Flex>
            <Flex sx={{ fontSize: 2, fontWeight: "medium" }}>
              {`${
                debtInFront[1] === AddressZero
                  ? debtInFront[0].prettify(2)
                  : debtInFront[0].div(100000).prettify(0) + "00000+"
              } ${COIN}`}
            </Flex>
          </Flex>
        </Flex>
      </Heading>
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
