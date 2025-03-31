import fs from "fs-extra";
import path from "path";

import { Interface, ParamType } from "@ethersproject/abi";

const getTupleType = (components: ParamType[], flexible: boolean) => {
  if (components.every(component => component.name)) {
    return (
      "{ " +
      components.map(component => `${component.name}: ${getType(component, flexible)}`).join("; ") +
      " }"
    );
  } else {
    return `[${components.map(component => getType(component, flexible)).join(", ")}]`;
  }
};

const getType = ({ baseType, components, arrayChildren }: ParamType, flexible: boolean): string => {
  switch (baseType) {
    case "address":
    case "string":
      return "string";

    case "bool":
      return "boolean";

    case "array":
      return `${getType(arrayChildren, flexible)}[]`;

    case "tuple":
      return getTupleType(components, flexible);
  }

  if (baseType.startsWith("bytes")) {
    return flexible ? "BytesLike" : "string";
  }

  const match = baseType.match(/^(u?int)([0-9]+)$/);
  if (match) {
    return flexible ? "BigNumberish" : parseInt(match[2]) >= 53 ? "BigNumber" : "number";
  }

  throw new Error(`unimplemented type ${baseType}`);
};

const declareInterface = ({
  contractName,
  interface: { events, functions }
}: {
  contractName: string;
  interface: Interface;
}) =>
  [
    `interface ${contractName}Calls {`,
    ...Object.values(functions)
      .filter(({ constant }) => constant)
      .map(({ name, inputs, outputs }) => {
        const params = [
          ...inputs.map((input, i) => `${input.name || "arg" + i}: ${getType(input, true)}`),
          `_overrides?: CallOverrides`
        ];

        let returnType: string;
        if (!outputs || outputs.length == 0) {
          returnType = "void";
        } else if (outputs.length === 1) {
          returnType = getType(outputs[0], false);
        } else {
          returnType = getTupleType(outputs, false);
        }

        return `  ${name}(${params.join(", ")}): Promise<${returnType}>;`;
      }),
    "}\n",

    `interface ${contractName}Transactions {`,
    ...Object.values(functions)
      .filter(({ constant }) => !constant)
      .map(({ name, payable, inputs, outputs }) => {
        const overridesType = payable ? "PayableOverrides" : "Overrides";

        const params = [
          ...inputs.map((input, i) => `${input.name || "arg" + i}: ${getType(input, true)}`),
          `_overrides?: ${overridesType}`
        ];

        let returnType: string;
        if (!outputs || outputs.length == 0) {
          returnType = "void";
        } else if (outputs.length === 1) {
          returnType = getType(outputs[0], false);
        } else {
          returnType = getTupleType(outputs, false);
        }

        return `  ${name}(${params.join(", ")}): Promise<${returnType}>;`;
      }),
    "}\n",

    `export interface ${contractName}`,
    `  extends _TypedProtocolContract<${contractName}Calls, ${contractName}Transactions> {`,

    "  readonly filters: {",
    ...Object.values(events).map(({ name, inputs }) => {
      const params = inputs.map(
        input => `${input.name}?: ${input.indexed ? `${getType(input, true)} | null` : "null"}`
      );

      return `    ${name}(${params.join(", ")}): EventFilter;`;
    }),
    "  };",

    ...Object.values(events).map(
      ({ name, inputs }) =>
        `  extractEvents(logs: Log[], name: "${name}"): _TypedLogDescription<${getTupleType(
          inputs,
          false
        )}>[];`
    ),

    "}"
  ].join("\n");

const contractList = [
  // Core
  "ActivePool",
  "BorrowerOperations",
  "CollSurplusPool",
  "DebtToken",
  "DefaultPool",
  "ERC20Mock",
  "GasPool",
  "HintHelpers",
  "IERC20",
  "MultiTroveGetter",
  "PriceFeed",
  "MockAggregator",
  "MockPriceFeed",
  "MockTellor",
  "SortedTroves",
  "StabilityPool",
  "TroveManager",
  "Unipool",
  "CommunityIssuance",
  "LockupContractFactory",
  "ProtocolTokenStaking",
  "ProtocolToken",
  // Periphery
  "USDFCView"
];

const artifactsDir = path.join("./", "artifacts");
const peripheryArtifactsDir = path.join("../periphery", "artifacts");

fs.removeSync("abi");
fs.mkdirSync("abi", { recursive: true });

const getContracts = (moduleDir: string) => {
  return fs
    .readdirSync(moduleDir)
    .filter(file => file.endsWith(".sol") && contractList.includes(file.replace(".sol", "")))
    .map(file => {
      const contractName = (file.split("/").pop() || "").replace(".sol", "");
      const fileContent = fs.readFileSync(`${moduleDir}/${file}/${contractName}.json`, "utf-8");
      const { abi } = JSON.parse(fileContent);
      fs.writeFileSync(path.join("abi", `${contractName}.json`), JSON.stringify(abi, undefined, 2));
      return {
        contractName,
        interface: new Interface(abi)
      };
    });
};

const contracts = [
  ...getContracts(`${artifactsDir}/contracts`),
  ...getContracts(`${artifactsDir}/contracts/LPRewards`),
  ...getContracts(`${artifactsDir}/contracts/ProtocolToken`),
  ...getContracts(`${artifactsDir}/contracts/TestContracts`),
  ...getContracts(`${artifactsDir}/contracts/Dependencies/OpenZeppelin/token/ERC20`),
  ...getContracts(`${peripheryArtifactsDir}/contracts`)
];

const output = `
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { Log } from "@ethersproject/abstract-provider";
import { BytesLike } from "@ethersproject/bytes";
import {
  Overrides,
  CallOverrides,
  PayableOverrides,
  EventFilter
} from "@ethersproject/contracts";

import { _TypedProtocolContract, _TypedLogDescription } from "../src/contracts";

${contracts.map(declareInterface).join("\n\n")}
`;

fs.mkdirSync("types", { recursive: true });
fs.writeFileSync(path.join("types", "index.ts"), output);
