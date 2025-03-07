import { AddressZero } from "@ethersproject/constants";
import { Decimal, Percent, SfStablecoinStoreState } from "@secured-finance/stablecoin-lib-base";
import { useSfStablecoinSelector } from "@secured-finance/stablecoin-lib-react";
import React from "react";
import { Box, Card, Heading, Link, Text } from "theme-ui";

import { useSfStablecoin } from "../hooks/SfStablecoinContext";
import * as l from "../lexicon";
import { CURRENCY } from "../strings";
import { Statistic } from "./Statistic";

const selectBalances = ({
  accountBalance,
  debtTokenBalance,
  protocolTokenBalance
}: SfStablecoinStoreState) => ({
  accountBalance,
  debtTokenBalance,
  protocolTokenBalance
});

const Balances: React.FC = () => {
  const { accountBalance, debtTokenBalance, protocolTokenBalance } =
    useSfStablecoinSelector(selectBalances);

  return (
    <Box sx={{ mb: 3 }}>
      <Heading>My Account Balances</Heading>
      <Statistic lexicon={l.FIL}>{accountBalance.prettify(4)}</Statistic>
      <Statistic lexicon={l.DEBT_TOKEN}>{debtTokenBalance.prettify()}</Statistic>
      <Statistic lexicon={l.PROTOCOL_TOKEN}>{protocolTokenBalance.prettify()}</Statistic>
    </Box>
  );
};

const GitHubCommit: React.FC<{ children?: string }> = ({ children }) =>
  children?.match(/[0-9a-f]{40}/) ? (
    <Link href={`https://github.com/liquity/dev/commit/${children}`}>{children.substr(0, 7)}</Link>
  ) : (
    <>unknown</>
  );

type SystemStatsProps = {
  variant?: string;
  showBalances?: boolean;
};

const select = ({
  numberOfTroves,
  price,
  total,
  debtTokenInStabilityPool,
  borrowingRate,
  redemptionRate,
  totalStakedProtocolToken,
  frontend
}: SfStablecoinStoreState) => ({
  numberOfTroves,
  price,
  total,
  debtTokenInStabilityPool,
  borrowingRate,
  redemptionRate,
  totalStakedProtocolToken,
  kickbackRate: frontend.status === "registered" ? frontend.kickbackRate : null
});

export const SystemStats: React.FC<SystemStatsProps> = ({ variant = "info", showBalances }) => {
  const {
    sfStablecoin: {
      connection: { version: contractsVersion, deploymentDate, frontendTag }
    }
  } = useSfStablecoin();

  const {
    numberOfTroves,
    price,
    debtTokenInStabilityPool,
    total,
    borrowingRate,
    totalStakedProtocolToken,
    kickbackRate
  } = useSfStablecoinSelector(select);

  const debtTokenInStabilityPoolPct =
    total.debt.nonZero && new Percent(debtTokenInStabilityPool.div(total.debt));
  const totalCollateralRatioPct = new Percent(total.collateralRatio(price));
  const borrowingFeePct = new Percent(borrowingRate);
  const kickbackRatePct = frontendTag === AddressZero ? "100" : kickbackRate?.mul(100).prettify();

  return (
    <Card {...{ variant }}>
      {showBalances && <Balances />}

      <Heading>Protocol statistics</Heading>

      <Heading as="h2" sx={{ mt: 3, fontWeight: "body" }}>
        Protocol
      </Heading>

      <Statistic lexicon={l.BORROW_FEE}>{borrowingFeePct.toString(2)}</Statistic>

      <Statistic lexicon={l.TVL}>
        {total.collateral.shorten()} <Text sx={{ fontSize: 1 }}>&nbsp;{CURRENCY}</Text>
        <Text sx={{ fontSize: 1 }}>
          &nbsp;(${Decimal.from(total.collateral.mul(price)).shorten()})
        </Text>
      </Statistic>
      <Statistic lexicon={l.TROVES}>{Decimal.from(numberOfTroves).prettify(0)}</Statistic>
      <Statistic lexicon={l.DEBT_TOKEN_SUPPLY}>{total.debt.shorten()}</Statistic>
      {debtTokenInStabilityPoolPct && (
        <Statistic lexicon={l.STABILITY_POOL_DEBT_TOKEN}>
          {debtTokenInStabilityPool.shorten()}
          <Text sx={{ fontSize: 1 }}>&nbsp;({debtTokenInStabilityPoolPct.toString(1)})</Text>
        </Statistic>
      )}
      <Statistic lexicon={l.STAKED_PROTOCOL_TOKEN}>{totalStakedProtocolToken.shorten()}</Statistic>
      <Statistic lexicon={l.TCR}>{totalCollateralRatioPct.prettify()}</Statistic>
      <Statistic lexicon={l.RECOVERY_MODE}>
        {total.collateralRatioIsBelowCritical(price) ? <Box color="danger">Yes</Box> : "No"}
      </Statistic>
      {}

      <Heading as="h2" sx={{ mt: 3, fontWeight: "body" }}>
        Frontend
      </Heading>
      {kickbackRatePct && <Statistic lexicon={l.KICKBACK_RATE}>{kickbackRatePct}%</Statistic>}

      <Box sx={{ mt: 3, opacity: 0.66 }}>
        <Box sx={{ fontSize: 0 }}>
          Contracts version: <GitHubCommit>{contractsVersion}</GitHubCommit>
        </Box>
        <Box sx={{ fontSize: 0 }}>Deployed: {deploymentDate.toLocaleString()}</Box>
        <Box sx={{ fontSize: 0 }}>
          Frontend version:{" "}
          {import.meta.env.DEV ? (
            "development"
          ) : (
            <GitHubCommit>{import.meta.env.VITE_APP_VERSION}</GitHubCommit>
          )}
        </Box>
      </Box>
    </Card>
  );
};
