import { useCallback, useEffect, useReducer, useRef } from "react";

import { SfStablecoinStoreState } from "@secured-finance/stablecoin-lib-base";

import { equals } from "../utils/equals";
import { useSfStablecoinStore } from "./useSfStablecoinStore";

export type SfStablecoinStoreUpdate<T = unknown> = {
  type: "updateStore";
  newState: SfStablecoinStoreState<T>;
  oldState: SfStablecoinStoreState<T>;
  stateChange: Partial<SfStablecoinStoreState<T>>;
};

export const useSfStablecoinReducer = <S, A, T>(
  reduce: (state: S, action: A | SfStablecoinStoreUpdate<T>) => S,
  init: (storeState: SfStablecoinStoreState<T>) => S
): [S, (action: A | SfStablecoinStoreUpdate<T>) => void] => {
  const store = useSfStablecoinStore<T>();
  const oldStore = useRef(store);
  const state = useRef(init(store.state));
  const [, rerender] = useReducer(() => ({}), {});

  const dispatch = useCallback(
    (action: A | SfStablecoinStoreUpdate<T>) => {
      const newState = reduce(state.current, action);

      if (!equals(newState, state.current)) {
        state.current = newState;
        rerender();
      }
    },
    [reduce]
  );

  useEffect(
    () => store.subscribe(params => dispatch({ type: "updateStore", ...params })),
    [store, dispatch]
  );

  if (oldStore.current !== store) {
    state.current = init(store.state);
    oldStore.current = store;
  }

  return [state.current, dispatch];
};
