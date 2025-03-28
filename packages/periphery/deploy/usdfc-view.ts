import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const contracts = await import(
    hre.network.name === "mainnet"
      ? "@secured-finance/stablecoin-contracts/deployments/outputs/mainnet.json"
      : "@secured-finance/stablecoin-contracts/deployments/outputs/testnet.json"
  );

  await deploy("USDFCView", {
    from: deployer,
    args: [contracts.troveManager.address, contracts.sortedTroves.address],
    log: true
  });
};

export default func;
func.tags = ["USDFCView"];
