import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig, getDefaultConnectors } from "connectkit";
import React from "react";
import { Flex, Heading, Paragraph, ThemeUIProvider } from "theme-ui";
import { WagmiProvider, createConfig, fallback, http } from "wagmi";
import { filecoin, filecoinCalibration, localhost } from "wagmi/chains";
import { injected } from "wagmi/connectors";

import { Icon } from "./components/Icon";
import { TransactionProvider } from "./components/Transaction";
import { WalletConnector } from "./components/WalletConnector";
import { getConfig } from "./config";
import { SfStablecoinProvider } from "./hooks/SfStablecoinContext";
import theme from "./theme";

import { SfStablecoinFrontend } from "./SfStablecoinFrontend";
import { AppLoader } from "./components/AppLoader";
import { useAsyncValue } from "./hooks/AsyncValue";
import { DisposableWalletProvider } from "./testUtils/DisposableWalletProvider";

const isDemoMode = import.meta.env.VITE_APP_DEMO_MODE === "true";

if (isDemoMode) {
  const ethereum = new DisposableWalletProvider(
    import.meta.env.VITE_APP_RPC_URL || `http://${window.location.hostname || "localhost"}:8545`,
    "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7"
  );

  Object.assign(window, { ethereum });
}

// Start pre-fetching the config
getConfig().then(config => {
  // console.log("Frontend config:");
  // console.log(config);
  Object.assign(window, { config });
});

const UnsupportedMainnetFallback: React.FC = () => (
  <Flex
    sx={{
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      textAlign: "center"
    }}
  >
    <Heading sx={{ mb: 3 }}>
      <Icon name="exclamation-triangle" /> This app is for testing purposes only.
    </Heading>

    <Paragraph sx={{ mb: 3 }}>Please change your network to Filecoin calibration.</Paragraph>
  </Flex>
);

const UnsupportedNetworkFallback: React.FC = () => (
  <Flex
    sx={{
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      textAlign: "center"
    }}
  >
    <Heading sx={{ mb: 3 }}>
      <Icon name="exclamation-triangle" /> This app is not supported on this network.
    </Heading>
    Please switch to Filecoin mainnet, or calibration.
  </Flex>
);

const queryClient = new QueryClient();

const appName = "SfStablecoin";
const appDescription = "Decentralized borrowing protocol";

const App = () => {
  const config = useAsyncValue(getConfig);
  const loader = <AppLoader />;

  return (
    <ThemeUIProvider theme={theme}>
      {config.loaded && (
        <WagmiProvider
          config={createConfig(
            getDefaultConfig({
              appName,
              appDescription,
              walletConnectProjectId: config.value.walletConnectProjectId,

              chains:
                isDemoMode || import.meta.env.MODE === "test"
                  ? [localhost]
                  : config.value.testnetOnly
                  ? [filecoinCalibration]
                  : [filecoin, filecoinCalibration],

              connectors:
                isDemoMode || import.meta.env.MODE === "test"
                  ? [injected()]
                  : getDefaultConnectors({
                      app: {
                        name: appName,
                        description: appDescription
                      },
                      walletConnectProjectId: config.value.walletConnectProjectId
                    }),

              transports: {
                [filecoin.id]: fallback([
                  ...(config.value.ankrApiKey
                    ? [http(`https://rpc.ankr.com/filecoin/${config.value.ankrApiKey}`)]
                    : []),
                  http()
                ]),

                [filecoinCalibration.id]: fallback([
                  ...(config.value.ankrApiKey
                    ? [http(`https://rpc.ankr.com/filecoin_testnet/${config.value.ankrApiKey}`)]
                    : []),
                  http()
                ]),

                [localhost.id]: http()
              }
            })
          )}
        >
          <QueryClientProvider client={queryClient}>
            <ConnectKitProvider options={{ hideBalance: true }}>
              <WalletConnector loader={loader}>
                <SfStablecoinProvider
                  loader={loader}
                  unsupportedNetworkFallback={<UnsupportedNetworkFallback />}
                  unsupportedMainnetFallback={<UnsupportedMainnetFallback />}
                >
                  <TransactionProvider>
                    <SfStablecoinFrontend loader={loader} />
                  </TransactionProvider>
                </SfStablecoinProvider>
              </WalletConnector>
            </ConnectKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      )}
    </ThemeUIProvider>
  );
};

export default App;
