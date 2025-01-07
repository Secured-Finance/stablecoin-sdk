import { useEffect } from "react";

import { ProtocolTokenStake, SfStablecoinStoreState } from "@secured-finance/stablecoin-lib-base";
import {
  SfStablecoinStoreUpdate,
  useSfStablecoinReducer
} from "@secured-finance/stablecoin-lib-react";

import { useMyTransactionState } from "../../Transaction";

import { StakingViewAction, StakingViewContext } from "./StakingViewContext";

type StakingViewProviderAction =
  | SfStablecoinStoreUpdate
  | StakingViewAction
  | { type: "startChange" | "abortChange" };

type StakingViewProviderState = {
  protocolTokenStake: ProtocolTokenStake;
  changePending: boolean;
  adjusting: boolean;
};

const init = ({ protocolTokenStake }: SfStablecoinStoreState): StakingViewProviderState => ({
  protocolTokenStake,
  changePending: false,
  adjusting: false
});

const reduce = (
  state: StakingViewProviderState,
  action: StakingViewProviderAction
): StakingViewProviderState => {
  // console.log(state);
  // console.log(action);

  switch (action.type) {
    case "startAdjusting":
      return { ...state, adjusting: true };

    case "cancelAdjusting":
      return { ...state, adjusting: false };

    case "startChange":
      return { ...state, changePending: true };

    case "abortChange":
      return { ...state, changePending: false };

    case "updateStore": {
      const {
        oldState: { protocolTokenStake: oldStake },
        stateChange: { protocolTokenStake: updatedStake }
      } = action;

      if (updatedStake) {
        const changeCommitted =
          !updatedStake.stakedProtocolToken.eq(oldStake.stakedProtocolToken) ||
          updatedStake.collateralGain.lt(oldStake.collateralGain) ||
          updatedStake.debtTokenGain.lt(oldStake.debtTokenGain);

        return {
          ...state,
          protocolTokenStake: updatedStake,
          adjusting: false,
          changePending: changeCommitted ? false : state.changePending
        };
      }
    }
  }

  return state;
};

export const StakingViewProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const stakingTransactionState = useMyTransactionState("stake");
  const [{ adjusting, changePending, protocolTokenStake }, dispatch] = useSfStablecoinReducer(
    reduce,
    init
  );

  useEffect(() => {
    if (
      stakingTransactionState.type === "waitingForApproval" ||
      stakingTransactionState.type === "waitingForConfirmation"
    ) {
      dispatch({ type: "startChange" });
    } else if (
      stakingTransactionState.type === "failed" ||
      stakingTransactionState.type === "cancelled"
    ) {
      dispatch({ type: "abortChange" });
    }
  }, [stakingTransactionState.type, dispatch]);

  return (
    <StakingViewContext.Provider
      value={{
        view: adjusting ? "ADJUSTING" : protocolTokenStake.isEmpty ? "NONE" : "ACTIVE",
        changePending,
        dispatch
      }}
    >
      {children}
    </StakingViewContext.Provider>
  );
};
