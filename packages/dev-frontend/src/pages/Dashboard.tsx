import { Container } from "theme-ui";

import { PriceManager } from "../components/PriceManager";
import { Stability } from "../components/Stability/Stability";
import { Staking } from "../components/Staking/Staking";
import { SystemStats } from "../components/SystemStats";
import { Trove } from "../components/Trove/Trove";

export const Dashboard: React.FC = () => (
  <Container variant="columns">
    <Container variant="left">
      <Trove />
      <Stability />
      <Staking />
    </Container>

    <Container variant="right">
      <SystemStats />
      <PriceManager />
    </Container>
  </Container>
);
