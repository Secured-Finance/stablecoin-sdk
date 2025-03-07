import React from "react";
import { Box, Card, Flex } from "theme-ui";

import {
  CRITICAL_COLLATERAL_RATIO,
  Decimal,
  Difference,
  Percent
} from "@secured-finance/stablecoin-lib-base";

import { Icon } from "../Icon";

import { InfoBubble } from "../InfoBubble";
import { InfoIcon } from "../InfoIcon";
import { LearnMoreLink } from "../Tooltip";
import { StaticRow } from "./Editor";

type CollateralRatioProps = {
  value?: Decimal;
  change?: Difference;
};

export const CollateralRatio: React.FC<CollateralRatioProps> = ({ value, change }) => {
  const collateralRatioPct = new Percent(value ?? { toString: () => "N/A" });
  const changePct = change && new Percent(change);
  return (
    <>
      <Flex>
        <Box sx={{ mt: [2, 0], ml: 3, mr: -2, fontSize: "24px" }}>
          <Icon name="heartbeat" />
        </Box>

        <StaticRow
          label="Collateral ratio"
          inputId="trove-collateral-ratio"
          amount={collateralRatioPct.prettify()}
          color={
            value?.gt(CRITICAL_COLLATERAL_RATIO)
              ? "success"
              : value?.gt(1.2)
              ? "warning"
              : value?.lte(1.2)
              ? "danger"
              : "muted"
          }
          pendingAmount={
            change?.positive?.absoluteValue?.gt(10)
              ? "++"
              : change?.negative?.absoluteValue?.gt(10)
              ? "--"
              : changePct?.nonZeroish(2)?.prettify()
          }
          pendingColor={change?.positive ? "success" : "danger"}
          infoIcon={
            <InfoIcon
              tooltip={
                <Card variant="tooltip" sx={{ width: "220px" }}>
                  The ratio between the dollar value of the collateral and the debt (in USDFC) you
                  are depositing. While the Minimum Collateral Ratio is 110% during normal operation,
                  it is recommended to keep the Collateral Ratio always above 150% to avoid
                  liquidation under Recovery Mode. A Collateral Ratio above 200% or 250% is
                  recommended for additional safety.
                </Card>
              }
            />
          }
        />
      </Flex>
    </>
  );
};

type CollateralRatioInfoBubbleProps = {
  value?: Decimal;
  change?: Difference;
};

export const CollateralRatioInfoBubble: React.FC<CollateralRatioInfoBubbleProps> = ({ value }) => {
  return (
    <>
      {value?.lt(1.5) && (
        <InfoBubble>
          Keep your collateral ratio above 150% to avoid being{" "}
          <LearnMoreLink link="https://docs.liquity.org/faq/stability-pool-and-liquidations#what-are-liquidations">
            liquidated
          </LearnMoreLink>{" "}
          under{" "}
          <LearnMoreLink link="https://docs.liquity.org/faq/recovery-mode">
            Recovery Mode.
          </LearnMoreLink>
        </InfoBubble>
      )}
    </>
  );
};
