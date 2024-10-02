import React from "react";
import { Box, Button, Flex, Heading, Text } from "theme-ui";

import { Decimal, LiquityStoreState } from "@secured-finance/lib-base";
import { useLiquitySelector } from "@secured-finance/lib-react";

import { useLiquity } from "../hooks/LiquityContext";
import { COIN, GT } from "../strings";
import { shortenAddress } from "../utils/shortenAddress";

import { ConnectKitButton } from "connectkit";
import { useBondAddresses } from "./Bonds/context/BondAddressesContext";
import { useBondView } from "./Bonds/context/BondViewContext";
import { Icon } from "./Icon";

const select = ({ accountBalance, lusdBalance, lqtyBalance }: LiquityStoreState) => ({
  accountBalance,
  lusdBalance,
  lqtyBalance
});

export const UserAccount: React.FC = () => {
  const { account } = useLiquity();
  const { accountBalance, lusdBalance: realLusdBalance, lqtyBalance } = useLiquitySelector(select);
  const { bLusdBalance, lusdBalance: customLusdBalance } = useBondView();
  const { LUSD_OVERRIDE_ADDRESS } = useBondAddresses();

  const lusdBalance = LUSD_OVERRIDE_ADDRESS === null ? realLusdBalance : customLusdBalance;

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

        {([
          ["ETH", accountBalance],
          [COIN, Decimal.from(lusdBalance || 0)],
          [GT, Decimal.from(lqtyBalance)],
          ["bLUSD", Decimal.from(bLusdBalance || 0)]
        ] as const).map(([currency, balance], i) => (
          <Flex key={i} sx={{ ml: 3, flexDirection: "column" }}>
            <Heading sx={{ fontSize: 1 }}>{currency}</Heading>
            <Text sx={{ fontSize: 1 }}>{balance.prettify()}</Text>
          </Flex>
        ))}
      </Box>
    </Flex>
  );
};
