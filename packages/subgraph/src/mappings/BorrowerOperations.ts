import {
  DebtTokenBorrowingFeePaid,
  TroveUpdated
} from "../../generated/BorrowerOperations/BorrowerOperations";

import { getTroveOperationFromBorrowerOperation } from "../types/TroveOperation";

import { increaseTotalBorrowingFeesPaid } from "../entities/Global";
import { setBorrowingFeeOfLastTroveChange, updateTrove } from "../entities/Trove";

export function handleTroveUpdated(event: TroveUpdated): void {
  updateTrove(
    event,
    getTroveOperationFromBorrowerOperation(event.params.operation),
    event.params._borrower,
    event.params._coll,
    event.params._debt,
    event.params.stake
  );
}

export function handleDebtTokenBorrowingFeePaid(event: DebtTokenBorrowingFeePaid): void {
  setBorrowingFeeOfLastTroveChange(event.params._debtTokenFee);
  increaseTotalBorrowingFeesPaid(event.params._debtTokenFee);
}
