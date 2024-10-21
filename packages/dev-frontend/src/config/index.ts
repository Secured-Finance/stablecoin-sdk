import { getAddress, isAddress } from "@ethersproject/address";
import { AddressZero } from "@ethersproject/constants";

export type FrontendConfig = {
  frontendTag: string;
  ankrApiKey?: string;
  testnetOnly?: boolean;
  walletConnectProjectId: string;
};

const defaultConfig: FrontendConfig = {
  frontendTag: AddressZero,
  walletConnectProjectId: "b16efb4fd41473c0f45dbad8efa15a00"
};

function hasKey<K extends string>(o: object, k: K): o is Record<K, unknown> {
  return k in o;
}

const parseConfig = (json: unknown): FrontendConfig => {
  const config = { ...defaultConfig };

  if (typeof json === "object" && json !== null) {
    if (hasKey(json, "frontendTag") && json.frontendTag !== "") {
      const { frontendTag } = json;

      if (typeof frontendTag === "string" && isAddress(frontendTag)) {
        config.frontendTag = getAddress(frontendTag);
      } else {
        console.error("Malformed frontendTag:");
        console.log(frontendTag);
      }
    }

    if (hasKey(json, "ankrApiKey") && json.ankrApiKey !== "") {
      const { ankrApiKey } = json;

      if (typeof ankrApiKey === "string") {
        config.ankrApiKey = ankrApiKey;
      } else {
        console.error("Malformed ankrApiKey:");
        console.log(ankrApiKey);
      }
    }

    if (hasKey(json, "testnetOnly")) {
      const { testnetOnly } = json;

      if (typeof testnetOnly === "boolean") {
        config.testnetOnly = testnetOnly;
      } else {
        console.error("Malformed testnetOnly:");
        console.log(testnetOnly);
      }
    }
  } else {
    console.error("Malformed config:");
    console.log(json);
  }

  return config;
};

let configPromise: Promise<FrontendConfig> | undefined = undefined;

const fetchConfig = async () => {
  try {
    const response = await fetch("config.json");

    if (!response.ok) {
      throw new Error(`Failed to fetch config.json (status ${response.status})`);
    }

    return parseConfig(await response.json());
  } catch (err) {
    console.error(err);
    return { ...defaultConfig };
  }
};

export const getConfig = (): Promise<FrontendConfig> => {
  if (!configPromise) {
    configPromise = fetchConfig();
  }

  return configPromise;
};
