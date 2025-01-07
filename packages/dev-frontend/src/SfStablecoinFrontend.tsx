import { Wallet } from "@ethersproject/wallet";
import React from "react";
import { Route, HashRouter as Router, Switch } from "react-router-dom";
import { Container, Flex } from "theme-ui";

import { Decimal, Difference, Trove } from "@secured-finance/stablecoin-lib-base";
import { SfStablecoinStoreProvider } from "@secured-finance/stablecoin-lib-react";

import { Header } from "./components/Header";
import { SystemStatsPopup } from "./components/SystemStatsPopup";
import { TransactionMonitor } from "./components/Transaction";
import { UserAccount } from "./components/UserAccount";
import { useSfStablecoin } from "./hooks/SfStablecoinContext";

import { PageSwitcher } from "./pages/PageSwitcher";
import { RiskyTrovesPage } from "./pages/RiskyTrovesPage";

import "tippy.js/dist/tippy.css"; // Tooltip default style
import { StabilityViewProvider } from "./components/Stability/context/StabilityViewProvider";
import { StakingViewProvider } from "./components/Staking/context/StakingViewProvider";
import { TroveViewProvider } from "./components/Trove/context/TroveViewProvider";

type SfStablecoinFrontendProps = {
  loader?: React.ReactNode;
};

export const SfStablecoinFrontend: React.FC<SfStablecoinFrontendProps> = ({ loader }) => {
  const { account, provider, sfStablecoin } = useSfStablecoin();

  // For console tinkering ;-)
  Object.assign(window, {
    account,
    provider,
    sfStablecoin,
    Trove,
    Decimal,
    Difference,
    Wallet
  });

  return (
    <SfStablecoinStoreProvider {...{ loader }} store={sfStablecoin.store}>
      <Router>
        <TroveViewProvider>
          <StabilityViewProvider>
            <StakingViewProvider>
              <Flex sx={{ flexDirection: "column", minHeight: "100%" }}>
                <Header>
                  <UserAccount />
                  <SystemStatsPopup />
                </Header>

                <Container
                  variant="main"
                  sx={{
                    display: "flex",
                    flexGrow: 1,
                    flexDirection: "column",
                    alignItems: "center"
                  }}
                >
                  <Switch>
                    <Route path="/" exact>
                      <PageSwitcher />
                    </Route>
                    <Route path="/risky-troves">
                      <RiskyTrovesPage />
                    </Route>
                  </Switch>
                </Container>
              </Flex>
            </StakingViewProvider>
          </StabilityViewProvider>
        </TroveViewProvider>
      </Router>
      <TransactionMonitor />
    </SfStablecoinStoreProvider>
  );
};
