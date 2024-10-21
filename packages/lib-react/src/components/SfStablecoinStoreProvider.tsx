import { SfStablecoinStore } from "@secured-finance/lib-base";
import React, { createContext, useEffect, useState } from "react";

export const SfStablecoinStoreContext = createContext<SfStablecoinStore | undefined>(undefined);

type SfStablecoinStoreProviderProps = {
  store: SfStablecoinStore;
  loader?: React.ReactNode;
  children?: React.ReactNode;
};

export const SfStablecoinStoreProvider: React.FC<SfStablecoinStoreProviderProps> = ({
  store,
  loader,
  children
}) => {
  const [loadedStore, setLoadedStore] = useState<SfStablecoinStore>();

  useEffect(() => {
    store.onLoaded = () => setLoadedStore(store);
    const stop = store.start();

    return () => {
      store.onLoaded = undefined;
      setLoadedStore(undefined);
      stop();
    };
  }, [store]);

  if (!loadedStore) {
    return <>{loader}</>;
  }

  return (
    <SfStablecoinStoreContext.Provider value={loadedStore}>
      {children}
    </SfStablecoinStoreContext.Provider>
  );
};
