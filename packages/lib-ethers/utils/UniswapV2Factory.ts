import assert from "assert";

import { Log } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";
import { Overrides } from "@ethersproject/contracts";

import { ethers } from "ethers";
import { _ProtocolContract, _TypedLogDescription, _TypedProtocolContract } from "../src/contracts";
import { log } from "./deploy";

const factoryAbi = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
  "function createPair(address tokenA, address tokenB) returns (address pair)",
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint)"
];

const factoryAddress = "0x9B3336186a38E1b6c21955d112dbb0343Ee061eE";

const hasFactory = (chainId: number) => [314].includes(chainId);

interface UniswapV2Factory
  extends _TypedProtocolContract<
    unknown,
    { createPair(tokenA: string, tokenB: string, _overrides?: Overrides): Promise<string> }
  > {
  extractEvents(
    logs: Log[],
    name: "PairCreated"
  ): _TypedLogDescription<{ token0: string; token1: string; pair: string }>[];
}

export const createUniswapV2Pair = async (
  signer: Signer,
  tokenA: string,
  tokenB: string,
  overrides?: Overrides
): Promise<string> => {
  const chainId = await signer.getChainId();

  if (!hasFactory(chainId)) {
    throw new Error(`UniswapV2Factory is not deployed on this network (chainId = ${chainId})`);
  }

  const factory = new _ProtocolContract(
    factoryAddress,
    factoryAbi,
    signer
  ) as unknown as UniswapV2Factory;

  const pairAddr = await factory.getPair(tokenA, tokenB);
  console.log("pairAddr:", pairAddr);

  if (pairAddr !== ethers.constants.Zero) {
    log(`Uniswap v2 WFIL <=> DebtToken pair already exists at ${pairAddr}`);
    return pairAddr;
  }

  log(`Creating Uniswap v2 WFIL <=> DebtToken pair...`);

  const tx = await factory.createPair(tokenA, tokenB, { ...overrides });
  const receipt = await tx.wait();
  const pairCreatedEvents = factory.extractEvents(receipt.logs, "PairCreated");

  assert(pairCreatedEvents.length === 1);
  return pairCreatedEvents[0].args.pair;
};
