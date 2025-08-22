import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as fs from "fs";
import * as path from "path";
import { keccak256 } from "ethers";

task("update-pair-code-hash", "Updates PAIR_CODE_HASH in CodeHelper.sol based on network configuration")
  .addFlag("skipcompile", "Skip compilation steps (useful if contracts are already compiled)")
  .setAction(async (args, hre: HardhatRuntimeEnvironment) => {
    // Step 1: Compile contracts first (unless skipped)
    if (!args.skipcompile) {
      console.log("🔄 Step 1: Compiling contracts to generate artifacts...");
      await hre.run("compile");
      console.log("✅ Initial compilation completed");
    }
    
    // Check if the network has polkavm flag set to true
    const networkConfig = hre.network.config as any;
    const isPolkaVM = networkConfig.polkavm === true;
    
    console.log(`\n📋 Step 2: Updating PAIR_CODE_HASH`);
    console.log(`Network: ${hre.network.name}`);
    console.log(`PolkaVM enabled: ${isPolkaVM}`);
    
    // Determine which artifact to read based on polkavm flag
    const artifactPath = isPolkaVM
      ? path.join(hre.config.paths.root, "artifacts-pvm/@uniswap/v2-core/contracts/UniswapV2Pair.sol/UniswapV2Pair.json")
      : path.join(hre.config.paths.root, "artifacts/@uniswap/v2-core/contracts/UniswapV2Pair.sol/UniswapV2Pair.json");
    
    console.log(`Reading artifact from: ${artifactPath}`);
    
    // Check if artifact file exists
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Artifact file not found at ${artifactPath}. Please compile the contracts first.`);
    }
    
    // Read the artifact file
    const artifactContent = fs.readFileSync(artifactPath, "utf8");
    const artifact = JSON.parse(artifactContent);
    
    // Extract bytecode
    let bytecode = artifact.bytecode;
    if (!bytecode || bytecode === "0x") {
      throw new Error("Bytecode not found or empty in the artifact file");
    }
    
    // Ensure bytecode starts with 0x
    if (!bytecode.startsWith("0x")) {
      bytecode = "0x" + bytecode;
    }
    
    // Calculate keccak256 hash of the bytecode
    const pairCodeHash = keccak256(bytecode);
    console.log(`Calculated PAIR_CODE_HASH: ${pairCodeHash}`);
    
    // Path to CodeHelper.sol
    const codeHelperPath = path.join(hre.config.paths.root, "contracts/libraries/CodeHelper.sol");
    
    // Create new content for CodeHelper.sol
    const newContent = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library CodeHelper {
    bytes32 constant PAIR_CODE_HASH = ${pairCodeHash};
}
`;
    
    // Overwrite the entire file
    fs.writeFileSync(codeHelperPath, newContent);
    
    console.log(`✅ Successfully updated PAIR_CODE_HASH in CodeHelper.sol to ${pairCodeHash}`);
    
    // Step 3: Compile contracts again after updating the hash (unless skipped)
    if (!args.skipcompile) {
      console.log("\n🔄 Step 3: Recompiling contracts with updated PAIR_CODE_HASH...");
      await hre.run("compile");
      console.log("✅ Final compilation completed");
      console.log("\n🎉 All steps completed successfully!");
    }
  });