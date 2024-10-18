import React from "react";
import { Button, Flex } from "theme-ui";

import {
  Decimal,
  Decimalish,
  LiquityStoreState,
  ProtocolTokenStake,
  ProtocolTokenStakeChange
} from "@secured-finance/lib-base";

import {
  LiquityStoreUpdate,
  useLiquityReducer,
  useLiquitySelector
} from "@secured-finance/lib-react";

import { COIN, GT } from "../../strings";

import { CURRENCY } from "../../strings";
import { ActionDescription, Amount } from "../ActionDescription";
import { ErrorDescription } from "../ErrorDescription";
import { InfoBubble } from "../InfoBubble";
import { useStakingView } from "./context/StakingViewContext";
import { StakingEditor } from "./StakingEditor";
import { StakingManagerAction } from "./StakingManagerAction";

const init = ({ protocolTokenStake }: LiquityStoreState) => ({
  originalStake: protocolTokenStake,
  editedProtocolToken: protocolTokenStake.stakedProtocolToken
});

type StakeManagerState = ReturnType<typeof init>;
type StakeManagerAction =
  | LiquityStoreUpdate
  | { type: "revert" }
  | { type: "setStake"; newValue: Decimalish };

const reduce = (state: StakeManagerState, action: StakeManagerAction): StakeManagerState => {
  // console.log(state);
  // console.log(action);

  const { originalStake, editedProtocolToken } = state;

  switch (action.type) {
    case "setStake":
      return { ...state, editedProtocolToken: Decimal.from(action.newValue) };

    case "revert":
      return { ...state, editedProtocolToken: originalStake.stakedProtocolToken };

    case "updateStore": {
      const {
        stateChange: { protocolTokenStake: updatedStake }
      } = action;

      if (updatedStake) {
        return {
          originalStake: updatedStake,
          editedProtocolToken: updatedStake.apply(originalStake.whatChanged(editedProtocolToken))
        };
      }
    }
  }

  return state;
};

const selectProtocolTokenBalance = ({ protocolTokenBalance }: LiquityStoreState) =>
  protocolTokenBalance;

type StakingManagerActionDescriptionProps = {
  originalStake: ProtocolTokenStake;
  change: ProtocolTokenStakeChange<Decimal>;
};

const StakingManagerActionDescription: React.FC<StakingManagerActionDescriptionProps> = ({
  originalStake,
  change
}) => {
  const stakeProtocolToken = change.stakeProtocolToken?.prettify().concat(" ", GT);
  const unstakeProtocolToken = change.unstakeProtocolToken?.prettify().concat(" ", GT);
  const collateralGain = originalStake.collateralGain.nonZero?.prettify(4).concat(` ${CURRENCY}`);
  const debtTokenGain = originalStake.debtTokenGain.nonZero?.prettify().concat(" ", COIN);

  if (originalStake.isEmpty && stakeProtocolToken) {
    return (
      <ActionDescription>
        You are staking <Amount>{stakeProtocolToken}</Amount>.
      </ActionDescription>
    );
  }

  return (
    <ActionDescription>
      {stakeProtocolToken && (
        <>
          You are adding <Amount>{stakeProtocolToken}</Amount> to your stake
        </>
      )}
      {unstakeProtocolToken && (
        <>
          You are withdrawing <Amount>{unstakeProtocolToken}</Amount> to your wallet
        </>
      )}
      {(collateralGain || debtTokenGain) && (
        <>
          {" "}
          and claiming{" "}
          {collateralGain && debtTokenGain ? (
            <>
              <Amount>{collateralGain}</Amount> and <Amount>{debtTokenGain}</Amount>
            </>
          ) : (
            <>
              <Amount>{collateralGain ?? debtTokenGain}</Amount>
            </>
          )}
        </>
      )}
      .
    </ActionDescription>
  );
};

export const StakingManager: React.FC = () => {
  const { dispatch: dispatchStakingViewAction } = useStakingView();
  const [{ originalStake, editedProtocolToken }, dispatch] = useLiquityReducer(reduce, init);
  const protocolTokenBalance = useLiquitySelector(selectProtocolTokenBalance);

  const change = originalStake.whatChanged(editedProtocolToken);
  const [validChange, description] = !change
    ? [undefined, undefined]
    : change.stakeProtocolToken?.gt(protocolTokenBalance)
    ? [
        undefined,
        <ErrorDescription>
          The amount you're trying to stake exceeds your balance by{" "}
          <Amount>
            {change.stakeProtocolToken.sub(protocolTokenBalance).prettify()} {GT}
          </Amount>
          .
        </ErrorDescription>
      ]
    : [change, <StakingManagerActionDescription originalStake={originalStake} change={change} />];

  const makingNewStake = originalStake.isEmpty;

  return (
    <StakingEditor title={"Staking"} {...{ originalStake, editedProtocolToken, dispatch }}>
      {description ??
        (makingNewStake ? (
          <InfoBubble>Enter the amount of {GT} you'd like to stake.</InfoBubble>
        ) : (
          <InfoBubble>Adjust the {GT} amount to stake or withdraw.</InfoBubble>
        ))}

      <Flex variant="layout.actions">
        <Button
          variant="cancel"
          onClick={() => dispatchStakingViewAction({ type: "cancelAdjusting" })}
        >
          Cancel
        </Button>

        {validChange ? (
          <StakingManagerAction change={validChange}>Confirm</StakingManagerAction>
        ) : (
          <Button disabled>Confirm</Button>
        )}
      </Flex>
    </StakingEditor>
  );
};
