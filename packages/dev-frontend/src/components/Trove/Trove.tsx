import { Decimal } from "@secured-finance/lib-base";
import React from "react";
import { Adjusting } from "./Adjusting";
import { useTroveView } from "./context/TroveViewContext";
import { LiquidatedTrove } from "./LiquidatedTrove";
import { NoTrove } from "./NoTrove";
import { Opening } from "./Opening";
import { ReadOnlyTrove } from "./ReadOnlyTrove";
import { RedeemedTrove } from "./RedeemedTrove";
import { TroveManager } from "./TroveManager";

export const Trove: React.FC = props => {
  const { view } = useTroveView();

  switch (view) {
    // loading state not needed, as main app has a loading spinner that blocks render until the backend data is available
    case "ACTIVE": {
      return <ReadOnlyTrove {...props} />;
    }
    case "ADJUSTING": {
      return <Adjusting {...props} />;
    }
    case "CLOSING": {
      return <TroveManager {...props} collateral={Decimal.ZERO} debt={Decimal.ZERO} />;
    }
    case "OPENING": {
      return <Opening {...props} />;
    }
    case "LIQUIDATED": {
      return <LiquidatedTrove {...props} />;
    }
    case "REDEEMED": {
      return <RedeemedTrove {...props} />;
    }
    case "NONE": {
      return <NoTrove {...props} />;
    }
  }
};
