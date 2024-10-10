import { BigInt, ethereum } from "@graphprotocol/graph-ts";

import { Redemption } from "../../generated/schema";

import { DECIMAL_ZERO, decimalize } from "../utils/bignumbers";

import { getGlobal, getRedemptionSequenceNumber } from "./Global";
import { getTransaction } from "./Transaction";
import { getUser } from "./User";

export function getCurrentRedemption(event: ethereum.Event): Redemption {
  let currentRedemptionId = getGlobal().currentRedemption;
  let currentRedemptionOrNull = Redemption.load(currentRedemptionId);

  if (currentRedemptionOrNull == null) {
    let sequenceNumber = getRedemptionSequenceNumber();
    let newRedemption = new Redemption(sequenceNumber.toString());

    newRedemption.sequenceNumber = sequenceNumber;
    newRedemption.transaction = getTransaction(event).id;
    newRedemption.redeemer = getUser(event.transaction.from).id;
    newRedemption.tokensAttemptedToRedeem = DECIMAL_ZERO;
    newRedemption.tokensActuallyRedeemed = DECIMAL_ZERO;
    newRedemption.collateralRedeemed = DECIMAL_ZERO;
    newRedemption.partial = false;
    newRedemption.fee = DECIMAL_ZERO;
    newRedemption.save();

    let global = getGlobal();
    global.currentRedemption = newRedemption.id;
    global.save();

    currentRedemptionOrNull = newRedemption;
  }

  return currentRedemptionOrNull as Redemption;
}

export function finishCurrentRedemption(
  event: ethereum.Event,
  _attemptedDebtTokenAmount: BigInt,
  _actualDebtTokenAmount: BigInt,
  _FILSent: BigInt,
  _FILFee: BigInt
): void {
  let fee = decimalize(_FILFee);

  let currentRedemption = getCurrentRedemption(event);
  currentRedemption.tokensAttemptedToRedeem = decimalize(_attemptedDebtTokenAmount);
  currentRedemption.tokensActuallyRedeemed = decimalize(_actualDebtTokenAmount);
  currentRedemption.collateralRedeemed = decimalize(_FILSent);
  currentRedemption.partial = _actualDebtTokenAmount < _attemptedDebtTokenAmount;
  currentRedemption.fee = fee;
  currentRedemption.save();

  let global = getGlobal();
  global.currentRedemption = null;
  global.totalRedemptionFeesPaid = global.totalRedemptionFeesPaid.plus(fee);
  global.save();
}
