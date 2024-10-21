import { Provider } from "@ethersproject/abstract-provider";
import { Web3Provider } from "@ethersproject/providers";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useClient, useWalletClient } from "wagmi";

import {
  BlockPolledSfStablecoinStore,
  EthersSfStablecoin,
  EthersSfStablecoinWithStore,
  _connectByChainId
} from "@secured-finance/lib-ethers";

import { FrontendConfig, getConfig } from "../config";
import { BatchedProvider } from "../providers/BatchingProvider";

type ContextValue = {
  config: FrontendConfig;
  account: string;
  provider: Provider;
  sfStablecoin: EthersSfStablecoinWithStore<BlockPolledSfStablecoinStore>;
};

const SfStablecoinContext = createContext<ContextValue | undefined>(undefined);

type SfStablecoinProviderProps = React.PropsWithChildren<{
  loader?: React.ReactNode;
  unsupportedNetworkFallback?: React.ReactNode;
  unsupportedMainnetFallback?: React.ReactNode;
}>;

export const SfStablecoinProvider: React.FC<SfStablecoinProviderProps> = ({
  children,
  loader,
  unsupportedNetworkFallback,
  unsupportedMainnetFallback
}) => {
  const chainId = useChainId();
  const client = useClient();

  const provider =
    client &&
    new Web3Provider(
      (method, params) =>
        client.request({
          method: method as any,
          params: params as any
        }),
      chainId
    );

  const account = useAccount();
  const walletClient = useWalletClient();

  const signer =
    account.address &&
    walletClient.data &&
    new Web3Provider(
      (method, params) =>
        walletClient.data.request({
          method: method as any,
          params: params as any
        }),
      chainId
    ).getSigner(account.address);

  const [config, setConfig] = useState<FrontendConfig>();

  const connection = useMemo(() => {
    if (config && provider && signer && account.address) {
      const batchedProvider = new BatchedProvider(provider, chainId);
      // batchedProvider._debugLog = true;

      try {
        return _connectByChainId(batchedProvider, signer, chainId, {
          userAddress: account.address,
          frontendTag: config.frontendTag,
          useStore: "blockPolled"
        });
      } catch (err) {
        console.error(err);
      }
    }
  }, [config, provider, signer, account.address, chainId]);

  useEffect(() => {
    getConfig().then(setConfig);
  }, []);

  if (!config || !provider || !signer || !account.address) {
    return <>{loader}</>;
  }

  if (config.testnetOnly && chainId === 1) {
    return <>{unsupportedMainnetFallback}</>;
  }

  if (!connection) {
    return <>{unsupportedNetworkFallback}</>;
  }

  const sfStablecoin = EthersSfStablecoin._from(connection);
  sfStablecoin.store.logging = true;

  return (
    <SfStablecoinContext.Provider
      value={{ config, account: account.address, provider: connection.provider, sfStablecoin }}
    >
      {children}
    </SfStablecoinContext.Provider>
  );
};

export const useSfStablecoin = () => {
  const context = useContext(SfStablecoinContext);

  if (!context) {
    throw new Error("You must provide a Context via SfStablecoinProvider");
  }

  return context;
};
