import React from "react";
import { Flex } from "theme-ui";

import { SfStablecoinStoreState } from "@secured-finance/lib-base";
import { useSfStablecoinSelector } from "@secured-finance/lib-react";

const selector = ({ remainingStabilityPoolProtocolTokenReward }: SfStablecoinStoreState) => ({
  remainingStabilityPoolProtocolTokenReward
});

export const RemainingProtocolToken: React.FC = () => {
  const { remainingStabilityPoolProtocolTokenReward } = useSfStablecoinSelector(selector);

  return (
    <Flex sx={{ mr: 2, fontSize: 2, fontWeight: "medium" }}>
      {remainingStabilityPoolProtocolTokenReward.prettify(0)} SCR remaining
    </Flex>
  );
};
