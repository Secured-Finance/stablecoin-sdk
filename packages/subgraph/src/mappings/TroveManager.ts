import {
  Liquidation,
  LTermsUpdated,
  Redemption,
  TroveLiquidated,
  TroveUpdated
} from "../../generated/TroveManager/TroveManager";

import { getTroveOperationFromTroveManagerOperation } from "../types/TroveOperation";

import { updateTotalRedistributed } from "../entities/Global";
import { finishCurrentLiquidation } from "../entities/Liquidation";
import { finishCurrentRedemption } from "../entities/Redemption";
import { applyRedistributionToTroveBeforeLiquidation, updateTrove } from "../entities/Trove";

export function handleTroveUpdated(event: TroveUpdated): void {
  updateTrove(
    event,
    getTroveOperationFromTroveManagerOperation(event.params._operation),
    event.params._borrower,
    event.params._coll,
    event.params._debt,
    event.params._stake
  );
}

export function handleTroveLiquidated(event: TroveLiquidated): void {
  applyRedistributionToTroveBeforeLiquidation(event, event.params._borrower);
  // No need to close the Trove yet, as TroveLiquidated will be followed by a TroveUpdated event
  // that sets collateral and debt to 0.
}

export function handleLiquidation(event: Liquidation): void {
  finishCurrentLiquidation(
    event,
    event.params._liquidatedColl,
    event.params._liquidatedDebt,
    event.params._collGasCompensation,
    event.params._debtGasCompensation
  );
}

export function handleRedemption(event: Redemption): void {
  finishCurrentRedemption(
    event,
    event.params._attemptedDebtTokenAmount,
    event.params._actualDebtTokenAmount,
    event.params._FILSent,
    event.params._FILFee
  );
}

export function handleLTermsUpdated(event: LTermsUpdated): void {
  updateTotalRedistributed(event.params._L_FIL, event.params._L_Debt);
}
