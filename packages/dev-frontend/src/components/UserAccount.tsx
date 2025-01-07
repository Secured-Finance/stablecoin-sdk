import React from "react";
import { Box, Button, Flex, Heading, Text } from "theme-ui";

import { Decimal, SfStablecoinStoreState } from "@secured-finance/stablecoin-lib-base";
import { useSfStablecoinSelector } from "@secured-finance/stablecoin-lib-react";

import { useSfStablecoin } from "../hooks/SfStablecoinContext";
import { COIN, CURRENCY, GT } from "../strings";
import { shortenAddress } from "../utils/shortenAddress";

import { ConnectKitButton } from "connectkit";
import { Icon } from "./Icon";

const select = ({
  accountBalance,
  debtTokenBalance,
  protocolTokenBalance
}: SfStablecoinStoreState) => ({
  accountBalance,
  debtTokenBalance,
  protocolTokenBalance
});

export const UserAccount: React.FC = () => {
  const { account } = useSfStablecoin();
  const { accountBalance, debtTokenBalance, protocolTokenBalance } = useSfStablecoinSelector(select);

  return (
    <Flex>
      <ConnectKitButton.Custom>
        {connectKit => (
          <Button
            variant="outline"
            sx={{ alignItems: "center", p: 2, mr: 3 }}
            onClick={connectKit.show}
          >
            <Icon name="user-circle" size="lg" />
            <Text as="span" sx={{ ml: 2, fontSize: 1 }}>
              {shortenAddress(account)}
            </Text>
          </Button>
        )}
      </ConnectKitButton.Custom>

      <Box
        sx={{
          display: ["none", "flex"],
          alignItems: "center"
        }}
      >
        <Icon name="wallet" size="lg" />

        {(
          [
            [CURRENCY, accountBalance],
            [COIN, Decimal.from(debtTokenBalance || 0)],
            [GT, Decimal.from(protocolTokenBalance)]
          ] as const
        ).map(([currency, balance], i) => (
          <Flex key={i} sx={{ ml: 3, flexDirection: "column" }}>
            <Heading sx={{ fontSize: 1 }}>{currency}</Heading>
            <Text sx={{ fontSize: 1 }}>{balance.prettify()}</Text>
          </Flex>
        ))}
      </Box>
    </Flex>
  );
};
