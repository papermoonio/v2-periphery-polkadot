import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// Override the default test task
task("test", "Run tests with automatic PAIR_CODE_HASH update")
  .addFlag("noupdate", "Skip PAIR_CODE_HASH update")
  .setAction(async (args, hre: HardhatRuntimeEnvironment, runSuper) => {
    // Update PAIR_CODE_HASH before running tests (unless skipped)
    if (!args.noupdate) {
      console.log("📋 Updating PAIR_CODE_HASH before running tests...\n");
      await hre.run("update-pair-code-hash");
      console.log("\n📝 Starting tests...\n");
    }
    
    // Run the original test task
    return runSuper(args);
  });