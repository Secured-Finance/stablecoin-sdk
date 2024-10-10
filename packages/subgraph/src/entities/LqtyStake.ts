import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { LqtyStake, LqtyStakeChange } from "../../generated/schema";

import { BIGINT_ZERO, DECIMAL_ZERO, decimalize } from "../utils/bignumbers";

import {
  decreaseNumberOfActiveLQTYStakes,
  increaseNumberOfActiveLQTYStakes,
  increaseTotalNumberOfLQTYStakes
} from "./Global";

import { beginChange, finishChange, initChange } from "./Change";
import { updateSystemStateByLqtyStakeChange } from "./SystemState";
import { getUser } from "./User";

function startLQTYStakeChange(event: ethereum.Event): LqtyStakeChange {
  let sequenceNumber = beginChange();
  let stakeChange = new LqtyStakeChange(sequenceNumber.toString());
  stakeChange.issuanceGain = DECIMAL_ZERO;
  stakeChange.redemptionGain = DECIMAL_ZERO;
  initChange(stakeChange, event, sequenceNumber);
  return stakeChange;
}

function finishLQTYStakeChange(stakeChange: LqtyStakeChange): void {
  finishChange(stakeChange);
  stakeChange.save();
}

function getUserStake(address: Address): LqtyStake | null {
  let user = getUser(address);

  if (user.stake == null) {
    return null;
  }

  return LqtyStake.load(user.stake);
}

function createStake(address: Address): LqtyStake {
  let user = getUser(address);
  let stake = new LqtyStake(address.toHexString());

  stake.owner = user.id;
  stake.amount = DECIMAL_ZERO;

  user.stake = stake.id;
  user.save();

  return stake;
}

function getOperationType(stake: LqtyStake | null, nextStakeAmount: BigDecimal): string {
  let isCreating = stake.amount == DECIMAL_ZERO && nextStakeAmount > DECIMAL_ZERO;
  if (isCreating) {
    return "stakeCreated";
  }

  let isIncreasing = nextStakeAmount > stake.amount;
  if (isIncreasing) {
    return "stakeIncreased";
  }

  let isRemoving = nextStakeAmount == DECIMAL_ZERO;
  if (isRemoving) {
    return "stakeRemoved";
  }

  return "stakeDecreased";
}

export function updateStake(event: ethereum.Event, address: Address, newStake: BigInt): void {
  let stake = getUserStake(address);
  let isUserFirstStake = stake == null;

  if (stake == null) {
    stake = createStake(address);
  }

  let nextStakeAmount = decimalize(newStake);

  let stakeChange = startLQTYStakeChange(event);
  stakeChange.stake = stake.id;
  stakeChange.stakeOperation = getOperationType(stake, nextStakeAmount);
  stakeChange.stakedAmountBefore = stake.amount;
  stakeChange.stakedAmountChange = nextStakeAmount.minus(stake.amount);
  stakeChange.stakedAmountAfter = nextStakeAmount;

  stake.amount = nextStakeAmount;

  if (stakeChange.stakeOperation == "stakeCreated") {
    if (isUserFirstStake) {
      increaseTotalNumberOfLQTYStakes();
    } else {
      increaseNumberOfActiveLQTYStakes();
    }
  } else if (stakeChange.stakeOperation == "stakeRemoved") {
    decreaseNumberOfActiveLQTYStakes();
  }

  updateSystemStateByLqtyStakeChange(stakeChange);
  finishLQTYStakeChange(stakeChange);

  stake.save();
}

export function withdrawStakeGains(
  event: ethereum.Event,
  address: Address,
  debtTokenGain: BigInt,
  FILGain: BigInt
): void {
  if (debtTokenGain == BIGINT_ZERO && FILGain == BIGINT_ZERO) {
    return;
  }

  let stake = getUserStake(address) || createStake(address);
  let stakeChange: LqtyStakeChange = startLQTYStakeChange(event);
  stakeChange.stake = stake.id;
  stakeChange.stakeOperation = "gainsWithdrawn";
  stakeChange.issuanceGain = decimalize(debtTokenGain);
  stakeChange.redemptionGain = decimalize(FILGain);
  stakeChange.stakedAmountBefore = stake.amount;
  stakeChange.stakedAmountChange = DECIMAL_ZERO;
  stakeChange.stakedAmountAfter = stake.amount;

  updateSystemStateByLqtyStakeChange(stakeChange);
  finishLQTYStakeChange(stakeChange);

  stake.save();
}
