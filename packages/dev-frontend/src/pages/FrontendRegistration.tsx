import React, { useState } from "react";
import { Box, Button, Card, Flex, Heading, Input, Label, Paragraph, Spinner } from "theme-ui";

import { Decimal } from "@secured-finance/stablecoin-lib-base";

import { Icon } from "../components/Icon";
import { Transaction, useMyTransactionState } from "../components/Transaction";
import { useSfStablecoin } from "../hooks/SfStablecoinContext";
import { shortenAddress } from "../utils/shortenAddress";

type FrontendRegistrationActionProps = {
  kickbackRate: Decimal;
};

const FrontendRegistrationAction: React.FC<FrontendRegistrationActionProps> = ({ kickbackRate }) => {
  const {
    sfStablecoin: { send: sfStablecoin }
  } = useSfStablecoin();

  const myTransactionId = "register-frontend";
  const myTransactionState = useMyTransactionState(myTransactionId);

  return myTransactionState.type === "waitingForApproval" ? (
    <Button disabled>
      <Spinner sx={{ mr: 2, color: "white" }} size={20} />
      Waiting for your approval
    </Button>
  ) : myTransactionState.type !== "waitingForConfirmation" &&
    myTransactionState.type !== "confirmed" ? (
    <Transaction
      id={myTransactionId}
      send={sfStablecoin.registerFrontend.bind(sfStablecoin, kickbackRate)}
    >
      <Button>Register</Button>
    </Transaction>
  ) : null;
};

export const FrontendRegistration: React.FC = () => {
  const { account } = useSfStablecoin();

  const [kickbackRate, setKickbackRate] = useState(Decimal.from(0.8));
  const [cut, setCut] = useState(Decimal.from(0.2));
  const [kickbackRateString, setKickbackRateString] = useState("80");

  return (
    <>
      <Card>
        <Heading>Choose a kickback rate</Heading>

        <Box sx={{ p: [2, 3] }}>
          <Flex>
            <Label>Kickback rate</Label>
            <Label variant="unit">%</Label>

            <Input
              sx={{ maxWidth: "200px" }}
              type="number"
              step="any"
              value={kickbackRateString}
              onChange={e => {
                setKickbackRateString(e.target.value);
                try {
                  const newKickbackRate = Decimal.from(e.target.value || 0).div(100);
                  const newCut = Decimal.ONE.sub(newKickbackRate);

                  setKickbackRate(newKickbackRate);
                  setCut(newCut);
                } catch {}
              }}
              onBlur={() => {
                setKickbackRateString(kickbackRate.mul(100).toString());
              }}
            />
          </Flex>
        </Box>
      </Card>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",

          m: 3,
          mt: [3, null, 4],
          mb: 4,
          p: 3,
          maxWidth: "450px",

          border: 1,
          borderRadius: "8px",
          borderColor: "danger",
          boxShadow: 2
        }}
      >
        <Flex sx={{ alignItems: "center", mx: 3, fontSize: 4 }}>
          <Icon name="hand-paper" />
          <Heading sx={{ ml: 3, fontSize: "18px" }}>Before you proceed</Heading>
        </Flex>

        <Paragraph sx={{ fontSize: 1, mt: 3 }}>
          You are about to register <b>{shortenAddress(account)}</b> to receive{" "}
          <b>{cut.mul(100).toString()}%</b> of the SCR rewards earned through this frontend.
        </Paragraph>

        <Paragraph sx={{ fontSize: 1, mt: 3, fontWeight: "bold" }}>
          You will not be able to change the kickback rate for this address later.
        </Paragraph>

        <Paragraph sx={{ fontSize: 1, mt: 3 }}>
          If you'd like to use a different kickback rate in the future, you will need to repeat this
          registration with a different address.
        </Paragraph>
      </Box>

      <FrontendRegistrationAction {...{ kickbackRate }} />
    </>
  );
};
