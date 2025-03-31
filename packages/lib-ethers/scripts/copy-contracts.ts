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
    const coreModuleDir = require
      .resolve("@secured-finance/stablecoin-contracts/package.json")
      .replace("/package.json", "");
    const peripheryModuleDir = require
      .resolve("@secured-finance/stablecoin-periphery/package.json")
      .replace("/package.json", "");
    const coreContractsDir = path.join(coreModuleDir, "contracts");
    const artifactsDir = path.join(coreModuleDir, "artifacts");
    const cacheDir = path.join(coreModuleDir, "cache");
    const peripheryContractsDir = path.join(peripheryModuleDir, "contracts");

    this.copyDirs(coreContractsDir, `${rootDir}/contracts`);
    this.copyDirs(artifactsDir, `${rootDir}/artifacts`);
    this.copyDirs(cacheDir, `${rootDir}/cache`);

    this.copyDirs(peripheryContractsDir, `${rootDir}/contracts`, false);
  }

  private copyDirs(src: string, dest: string, force = true) {
    if (force) {
      if (existsSync(dest)) {
        rmSync(dest, { recursive: true });
      }

      mkdirSync(dest);
    }

    for (const dir of readdirSync(src)) {
      this.copyDir(`${src}/${dir}`, `${dest}/${dir}`);
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
