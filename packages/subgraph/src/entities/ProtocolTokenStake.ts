import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { ProtocolTokenStake, ProtocolTokenStakeChange } from "../../generated/schema";

import { BIGINT_ZERO, DECIMAL_ZERO, decimalize } from "../utils/bignumbers";

import {
  decreaseNumberOfActiveProtocolTokenStakes,
  increaseNumberOfActiveProtocolTokenStakes,
  increaseTotalNumberOfProtocolTokenStakes
} from "./Global";

import { beginChange, finishChange, initChange } from "./Change";
import { updateSystemStateByProtocolTokenStakeChange } from "./SystemState";
import { getUser } from "./User";

function startProtocolTokenStakeChange(event: ethereum.Event): ProtocolTokenStakeChange {
  let sequenceNumber = beginChange();
  let stakeChange = new ProtocolTokenStakeChange(sequenceNumber.toString());
  stakeChange.issuanceGain = DECIMAL_ZERO;
  stakeChange.redemptionGain = DECIMAL_ZERO;
  initChange(stakeChange, event, sequenceNumber);
  return stakeChange;
}

function finishProtocolTokenStakeChange(stakeChange: ProtocolTokenStakeChange): void {
  finishChange(stakeChange);
  stakeChange.save();
}

function getUserStake(address: Address): ProtocolTokenStake | null {
  let user = getUser(address);

  if (user.stake == null) {
    return null;
  }

  return ProtocolTokenStake.load(user.stake);
}

function createStake(address: Address): ProtocolTokenStake {
  let user = getUser(address);
  let stake = new ProtocolTokenStake(address.toHexString());

  stake.owner = user.id;
  stake.amount = DECIMAL_ZERO;

  user.stake = stake.id;
  user.save();

  return stake;
}

function getOperationType(stake: ProtocolTokenStake | null, nextStakeAmount: BigDecimal): string {
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

  let stakeChange = startProtocolTokenStakeChange(event);
  stakeChange.stake = stake.id;
  stakeChange.stakeOperation = getOperationType(stake, nextStakeAmount);
  stakeChange.stakedAmountBefore = stake.amount;
  stakeChange.stakedAmountChange = nextStakeAmount.minus(stake.amount);
  stakeChange.stakedAmountAfter = nextStakeAmount;

  stake.amount = nextStakeAmount;

  if (stakeChange.stakeOperation == "stakeCreated") {
    if (isUserFirstStake) {
      increaseTotalNumberOfProtocolTokenStakes();
    } else {
      increaseNumberOfActiveProtocolTokenStakes();
    }
  } else if (stakeChange.stakeOperation == "stakeRemoved") {
    decreaseNumberOfActiveProtocolTokenStakes();
  }

  updateSystemStateByProtocolTokenStakeChange(stakeChange);
  finishProtocolTokenStakeChange(stakeChange);

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
  let stakeChange: ProtocolTokenStakeChange = startProtocolTokenStakeChange(event);
  stakeChange.stake = stake.id;
  stakeChange.stakeOperation = "gainsWithdrawn";
  stakeChange.issuanceGain = decimalize(debtTokenGain);
  stakeChange.redemptionGain = decimalize(FILGain);
  stakeChange.stakedAmountBefore = stake.amount;
  stakeChange.stakedAmountChange = DECIMAL_ZERO;
  stakeChange.stakedAmountAfter = stake.amount;

  updateSystemStateByProtocolTokenStakeChange(stakeChange);
  finishProtocolTokenStakeChange(stakeChange);

  stake.save();
}
