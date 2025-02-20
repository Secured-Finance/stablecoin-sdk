import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "fs";
import path from "path";

const excludedContracts = [
  "DappSys",
  "CDPManagerTester.sol",
  "EchidnaProxy.sol",
  "EchidnaTester.sol"
];

class Main {
  run() {
    const rootDir = process.cwd();
    const moduleDir = require
      .resolve("@secured-finance/stablecoin-contracts/package.json")
      .replace("/package.json", "");
    const contractsDir = path.join(moduleDir, "contracts");

    const destination = `${rootDir}/contracts`;
    if (existsSync(destination)) {
      rmSync(destination, { recursive: true });
    }
    mkdirSync(destination);

    for (const artifact of readdirSync(contractsDir)) {
      this.copyDir(`${contractsDir}/${artifact}`, `${destination}/${artifact}`);
    }
  }

  private copyDir(src: string, dest: string) {
    try {
      if (statSync(src).isFile()) {
        copyFileSync(src, dest);
        return;
      } else {
        mkdirSync(dest, { recursive: true });
      }

      const files = readdirSync(src, { withFileTypes: true });

      for (const file of files) {
        const srcPath = path.join(src, file.name);
        const destPath = path.join(dest, file.name);

        if (excludedContracts.includes(file.name)) {
          continue;
        }

        if (file.isDirectory()) {
          this.copyDir(srcPath, destPath);
        } else {
          copyFileSync(srcPath, destPath);
        }
      }
    } catch (error) {
      console.error(`Error while copying directory: ${error}`);
      throw error;
    }
  }
}

new Main().run();
