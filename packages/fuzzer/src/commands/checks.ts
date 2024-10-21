import { EthersSfStablecoin } from "@secured-finance/lib-ethers";

import { deployer, subgraph } from "../globals";

import {
  checkSubgraph,
  checkTroveOrdering,
  dumpTroves,
  getListOfTrovesBeforeRedistribution
} from "../utils";

export const checkSorting = async () => {
  const deployerSfStablecoin = await EthersSfStablecoin.connect(deployer);
  const listOfTroves = await getListOfTrovesBeforeRedistribution(deployerSfStablecoin);
  const totalRedistributed = await deployerSfStablecoin.getTotalRedistributed();
  const price = await deployerSfStablecoin.getPrice();

  checkTroveOrdering(listOfTroves, totalRedistributed, price);

  console.log("All Troves are sorted.");
};

export const checkSubgraphCmd = async () => {
  const deployerSfStablecoin = await EthersSfStablecoin.connect(deployer);

  await checkSubgraph(subgraph, deployerSfStablecoin);

  console.log("Subgraph looks fine.");
};

export const dumpTrovesCmd = async () => {
  const deployerSfStablecoin = await EthersSfStablecoin.connect(deployer);
  const listOfTroves = await getListOfTrovesBeforeRedistribution(deployerSfStablecoin);
  const totalRedistributed = await deployerSfStablecoin.getTotalRedistributed();
  const price = await deployerSfStablecoin.getPrice();

  dumpTroves(listOfTroves, totalRedistributed, price);
};
