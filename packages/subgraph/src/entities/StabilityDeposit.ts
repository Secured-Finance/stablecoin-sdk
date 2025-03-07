import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { StabilityDeposit, StabilityDepositChange } from "../../generated/schema";

import { BIGINT_ZERO, DECIMAL_ZERO, decimalize } from "../utils/bignumbers";

import { beginChange, finishChange, initChange } from "./Change";
import { updateSystemStateByStabilityDepositChange } from "./SystemState";
import { getUser } from "./User";

function getStabilityDeposit(_user: Address): StabilityDeposit {
  let id = _user.toHexString();
  let stabilityDepositOrNull = StabilityDeposit.load(id);

  if (stabilityDepositOrNull != null) {
    return stabilityDepositOrNull as StabilityDeposit;
  } else {
    let owner = getUser(_user);
    let newStabilityDeposit = new StabilityDeposit(id);

    newStabilityDeposit.owner = owner.id;
    newStabilityDeposit.depositedAmount = DECIMAL_ZERO;
    owner.stabilityDeposit = newStabilityDeposit.id;
    owner.save();

    return newStabilityDeposit;
  }
}

function createStabilityDepositChange(event: ethereum.Event): StabilityDepositChange {
  let sequenceNumber = beginChange();
  let stabilityDepositChange = new StabilityDepositChange(sequenceNumber.toString());
  initChange(stabilityDepositChange, event, sequenceNumber);

  return stabilityDepositChange;
}

function finishStabilityDepositChange(stabilityDepositChange: StabilityDepositChange): void {
  finishChange(stabilityDepositChange);
  stabilityDepositChange.save();
}

function updateStabilityDepositByOperation(
  event: ethereum.Event,
  stabilityDeposit: StabilityDeposit,
  operation: string,
  newDepositedAmount: BigDecimal,
  collateralGain: BigDecimal | null = null
): void {
  let stabilityDepositChange = createStabilityDepositChange(event);

  stabilityDepositChange.stabilityDeposit = stabilityDeposit.id;
  stabilityDepositChange.stabilityDepositOperation = operation;
  stabilityDepositChange.depositedAmountBefore = stabilityDeposit.depositedAmount;

  stabilityDeposit.depositedAmount = newDepositedAmount;

  stabilityDepositChange.depositedAmountAfter = stabilityDeposit.depositedAmount;
  stabilityDepositChange.depositedAmountChange = stabilityDepositChange.depositedAmountAfter.minus(
    stabilityDepositChange.depositedAmountBefore
  );

  if (collateralGain != null) {
    stabilityDepositChange.collateralGain = collateralGain;
  }

  updateSystemStateByStabilityDepositChange(stabilityDepositChange);
  finishStabilityDepositChange(stabilityDepositChange);
}

export function updateStabilityDeposit(
  event: ethereum.Event,
  _user: Address,
  _amount: BigInt
): void {
  let stabilityDeposit = getStabilityDeposit(_user);
  let newDepositedAmount = decimalize(_amount);
  let owner = getUser(_user);

  if (newDepositedAmount == stabilityDeposit.depositedAmount) {
    // Don't create a StabilityDepositChange when there's no change... duh.
    // It means user only wanted to withdraw collateral gains.
    return;
  }

  if (owner.frontend != stabilityDeposit.frontend) {
    // FrontEndTagSet is emitted just before UserDepositChanged event
    // FrontEndTagSet sets the owner.frontend, so we can use that
    stabilityDeposit.frontend = owner.frontend;
  }

  updateStabilityDepositByOperation(
    event,
    stabilityDeposit,
    newDepositedAmount > stabilityDeposit.depositedAmount ? "depositTokens" : "withdrawTokens",
    newDepositedAmount
  );

  stabilityDeposit.save();
}

export function withdrawCollateralGainFromStabilityDeposit(
  event: ethereum.Event,
  _user: Address,
  _FIL: BigInt,
  _debtTokenLoss: BigInt
): void {
  if (_FIL == BIGINT_ZERO && _debtTokenLoss == BIGINT_ZERO) {
    // Ignore "NOP" event
    return;
  }

  let stabilityDeposit = getStabilityDeposit(_user) as StabilityDeposit;
  let depositLoss = decimalize(_debtTokenLoss);
  let newDepositedAmount = stabilityDeposit.depositedAmount.minus(depositLoss);

  updateStabilityDepositByOperation(
    event,
    stabilityDeposit,
    "withdrawCollateralGain",
    newDepositedAmount,
    decimalize(_FIL)
  );

  stabilityDeposit.save();
}
