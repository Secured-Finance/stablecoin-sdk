import React from "react";
import { Box, Card, Container, Paragraph, Text } from "theme-ui";
import { InfoMessage } from "../components/InfoMessage";
import { Link } from "../components/Link";
import { PriceManager } from "../components/PriceManager";
import { Redemption } from "../components/Redemption/Redemption";
import { SystemStats } from "../components/SystemStats";
import { COIN } from "../strings";

export const RedemptionPage: React.FC = () => (
  <Container variant="columns">
    <Container variant="left">
      <Card>
        <Box sx={{ p: [2, 3] }}>
          <InfoMessage title="Bot functionality">
            <Paragraph>
              Redemptions are expected to be carried out by bots when arbitrage opportunities emerge.
            </Paragraph>
            <Paragraph>
              Most of the time you will get a better rate for converting {COIN} to tFIL on other
              exchanges.
            </Paragraph>
            <Paragraph>
              <Text sx={{ fontWeight: "bold" }}>Note: </Text>Redemption is not for repaying your
              loan. To repay your loan, adjust or close your Trove on the
              <Link to="/" sx={{ variant: "styles.a" }}>
                Dashboard
              </Link>
            </Paragraph>
          </InfoMessage>
        </Box>
      </Card>
      <Redemption />
    </Container>
    <Container variant="right">
      <SystemStats />
      <PriceManager />
    </Container>
  </Container>
);
