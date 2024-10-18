import React from "react";
import { Flex } from "theme-ui";

import { LiquityStoreState } from "@secured-finance/lib-base";
import { useLiquitySelector } from "@secured-finance/lib-react";

const selector = ({ remainingStabilityPoolProtocolTokenReward }: LiquityStoreState) => ({
  remainingStabilityPoolProtocolTokenReward
});

export const RemainingProtocolToken: React.FC = () => {
  const { remainingStabilityPoolProtocolTokenReward } = useLiquitySelector(selector);

  return (
    <Flex sx={{ mr: 2, fontSize: 2, fontWeight: "medium" }}>
      {remainingStabilityPoolProtocolTokenReward.prettify(0)} SCR remaining
    </Flex>
  );
};
