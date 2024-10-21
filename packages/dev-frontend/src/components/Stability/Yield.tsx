import { Decimal, SfStablecoinStoreState } from "@secured-finance/lib-base";
import { useSfStablecoinSelector } from "@secured-finance/lib-react";
import React, { useEffect, useState } from "react";
import { Card, Paragraph, Text } from "theme-ui";
import { CURRENCY } from "../../strings";
import { Badge } from "../Badge";
import { InfoIcon } from "../InfoIcon";
import { fetchLqtyPrice } from "./context/fetchLqtyPrice";

const selector = ({
  debtTokenInStabilityPool,
  remainingStabilityPoolProtocolTokenReward
}: SfStablecoinStoreState) => ({
  debtTokenInStabilityPool,
  remainingStabilityPoolProtocolTokenReward
});

const yearlyIssuanceFraction = 0.5;
const dailyIssuanceFraction = Decimal.from(1 - yearlyIssuanceFraction ** (1 / 365));
const dailyIssuancePercentage = dailyIssuanceFraction.mul(100);

export const Yield: React.FC = () => {
  const { debtTokenInStabilityPool, remainingStabilityPoolProtocolTokenReward } =
    useSfStablecoinSelector(selector);

  const [lqtyPrice, setLqtyPrice] = useState<Decimal | undefined>(undefined);
  const hasZeroValue =
    remainingStabilityPoolProtocolTokenReward.isZero || debtTokenInStabilityPool.isZero;

  useEffect(() => {
    (async () => {
      try {
        const { lqtyPriceUSD } = await fetchLqtyPrice();
        setLqtyPrice(lqtyPriceUSD);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  if (hasZeroValue || lqtyPrice === undefined) return null;

  const lqtyIssuanceOneDay = remainingStabilityPoolProtocolTokenReward.mul(dailyIssuanceFraction);
  const lqtyIssuanceOneDayInUSD = lqtyIssuanceOneDay.mul(lqtyPrice);
  const aprPercentage = lqtyIssuanceOneDayInUSD.mulDiv(365 * 100, debtTokenInStabilityPool);
  const remainingLqtyInUSD = remainingStabilityPoolProtocolTokenReward.mul(lqtyPrice);

  if (aprPercentage.isZero) return null;

  return (
    <Badge>
      <Text>SCR APR {aprPercentage.toString(2)}%</Text>
      <InfoIcon
        tooltip={
          <Card variant="tooltip" sx={{ width: ["220px", "518px"] }}>
            <Paragraph>
              An <Text sx={{ fontWeight: "bold" }}>estimate</Text> of the SCR return on the USDFC
              deposited to the Stability Pool over the next year, not including your {CURRENCY} gains
              from liquidations.
            </Paragraph>
            <Paragraph sx={{ fontSize: "12px", fontFamily: "monospace", mt: 2 }}>
              ($SCR_REWARDS * DAILY_ISSUANCE% / DEPOSITED_USDFC) * 365 * 100 ={" "}
              <Text sx={{ fontWeight: "bold" }}> APR</Text>
            </Paragraph>
            <Paragraph sx={{ fontSize: "12px", fontFamily: "monospace" }}>
              ($
              {remainingLqtyInUSD.shorten()} * {dailyIssuancePercentage.toString(4)}% / $
              {debtTokenInStabilityPool.shorten()}) * 365 * 100 =
              <Text sx={{ fontWeight: "bold" }}> {aprPercentage.toString(2)}%</Text>
            </Paragraph>
          </Card>
        }
      ></InfoIcon>
    </Badge>
  );
};
