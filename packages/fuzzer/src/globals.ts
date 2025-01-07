import { JsonRpcProvider } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";
import dotenv from "dotenv";

import { SubgraphSfStablecoin } from "@secured-finance/stablecoin-lib-subgraph";

dotenv.config();

export const provider = new JsonRpcProvider("http://localhost:8545");
export const subgraph = new SubgraphSfStablecoin(
  "http://localhost:8000/subgraphs/name/stablecoin-sdk/subgraph"
);

export const deployer = process.env.DEPLOYER_PRIVATE_KEY
  ? new Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)
  : Wallet.createRandom().connect(provider);

export const funder = new Wallet(
  "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7",
  provider
);
