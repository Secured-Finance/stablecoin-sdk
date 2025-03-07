import {
  Decimal,
  SfStablecoinStoreState,
  StabilityDeposit,
  StabilityDepositChange
} from "@secured-finance/stablecoin-lib-base";

import { COIN } from "../../../strings";
import { Amount } from "../../ActionDescription";
import { ErrorDescription } from "../../ErrorDescription";
import { StabilityActionDescription } from "../StabilityActionDescription";

export const selectForStabilityDepositChangeValidation = ({
  trove,
  debtTokenBalance,
  ownFrontend,
  haveUndercollateralizedTroves
}: SfStablecoinStoreState) => ({
  trove,
  debtTokenBalance,
  haveOwnFrontend: ownFrontend.status === "registered",
  haveUndercollateralizedTroves
});

type StabilityDepositChangeValidationContext = ReturnType<
  typeof selectForStabilityDepositChangeValidation
>;

export const validateStabilityDepositChange = (
  originalDeposit: StabilityDeposit,
  editedDebtToken: Decimal,
  {
    debtTokenBalance,
    haveOwnFrontend,
    haveUndercollateralizedTroves
  }: StabilityDepositChangeValidationContext
): [
  validChange: StabilityDepositChange<Decimal> | undefined,
  description: JSX.Element | undefined
] => {
  const change = originalDeposit.whatChanged(editedDebtToken);

  if (haveOwnFrontend) {
    return [
      undefined,
      <ErrorDescription>
        You can’t deposit using a wallet address that is registered as a frontend.
      </ErrorDescription>
    ];
  }

  if (!change) {
    return [undefined, undefined];
  }

  if (change.depositDebtToken?.gt(debtTokenBalance)) {
    return [
      undefined,
      <ErrorDescription>
        The amount you're trying to deposit exceeds your balance by{" "}
        <Amount>
          {change.depositDebtToken.sub(debtTokenBalance).prettify()} {COIN}
        </Amount>
        .
      </ErrorDescription>
    ];
  }

  if (change.withdrawDebtToken && haveUndercollateralizedTroves) {
    return [
      undefined,
      <ErrorDescription>
        You're not allowed to withdraw USDFC from your Stability Deposit when there are
        undercollateralized Troves. Please liquidate those Troves or try again later.
      </ErrorDescription>
    ];
  }

  return [change, <StabilityActionDescription originalDeposit={originalDeposit} change={change} />];
};
