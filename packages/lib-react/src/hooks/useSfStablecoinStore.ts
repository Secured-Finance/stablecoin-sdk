import { useContext } from "react";

import { SfStablecoinStore } from "@secured-finance/lib-base";

import { SfStablecoinStoreContext } from "../components/SfStablecoinStoreProvider";

export const useSfStablecoinStore = <T>(): SfStablecoinStore<T> => {
  const store = useContext(SfStablecoinStoreContext);

  if (!store) {
    throw new Error("You must provide a SfStablecoinStore via SfStablecoinStoreProvider");
  }

  return store as SfStablecoinStore<T>;
};
