import { AddressZero } from "@ethersproject/constants";
import { useEffect, useState } from "react";

import { SfStablecoinStoreState } from "@secured-finance/lib-base";
import { useSfStablecoinSelector } from "@secured-finance/lib-react";

import { useSfStablecoin } from "../hooks/SfStablecoinContext";

import { Dashboard } from "./Dashboard";
import { FrontendRegistration } from "./FrontendRegistration";
import { FrontendRegistrationSuccess } from "./FrontendRegistrationSuccess";
import { UnregisteredFrontend } from "./UnregisteredFrontend";

const selectFrontend = ({ frontend }: SfStablecoinStoreState) => frontend;

export const PageSwitcher: React.FC = () => {
  const {
    account,
    config: { frontendTag }
  } = useSfStablecoin();

  const frontend = useSfStablecoinSelector(selectFrontend);
  const unregistered = frontendTag !== AddressZero && frontend.status === "unregistered";

  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (unregistered) {
      setRegistering(true);
    }
  }, [unregistered]);

  if (registering || unregistered) {
    if (frontend.status === "registered") {
      return <FrontendRegistrationSuccess onDismiss={() => setRegistering(false)} />;
    } else if (account === frontendTag) {
      return <FrontendRegistration />;
    } else {
      return <UnregisteredFrontend />;
    }
  } else {
    return <Dashboard />;
  }
};
