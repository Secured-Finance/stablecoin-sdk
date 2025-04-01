import fs from "fs";
import path from "path";

const outputDir = "deployments";
const inputDir = (channel: string) => path.join("deployments", channel);
const peripheryModuleDir = require
  .resolve("@secured-finance/stablecoin-periphery/package.json")
  .replace("/package.json", "");

const backfillChannel = "backfill";
const defaultChannel = "default";

const peripheryFiles = {
  usdfcView: "USDFCView.json"
};

const exists = (dir: string) => {
  return fs.existsSync(dir) && fs.lstatSync(dir).isDirectory();
};

const copyDeploymentsFrom = (deploymentsDir: string) => {
  const deployments = fs.readdirSync(deploymentsDir);

  for (const deployment of deployments) {
    const deploymentsJson = JSON.parse(
      fs.readFileSync(path.join(deploymentsDir, deployment), "utf-8")
    );

    // Add periphery contract addresses to the deployment
    for (const [key, value] of Object.entries(peripheryFiles)) {
      const filePath = path.join(
        peripheryModuleDir,
        "deployments",
        deployment.replace(".json", ""),
        value
      );

      if (fs.existsSync(filePath)) {
        const fileContent = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        deploymentsJson.addresses[key] = fileContent.address;
      }
    }

    fs.writeFileSync(
      path.join(outputDir, deployment),
      JSON.stringify(deploymentsJson, undefined, 2)
    );
  }
};

console.log(`Deployment channel: ${process.env.CHANNEL ?? "default"}`);

copyDeploymentsFrom(inputDir(backfillChannel));
copyDeploymentsFrom(inputDir(defaultChannel));

if (process.env.CHANNEL && process.env.CHANNEL !== defaultChannel) {
  const channelDir = inputDir(process.env.CHANNEL);

  if (exists(channelDir)) {
    copyDeploymentsFrom(channelDir);
  }
}
