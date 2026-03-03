import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@parity/hardhat-polkadot";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
// Import custom tasks
// import "./tasks/update-pair-code-hash";
// import "./tasks/test-with-hash-update";
dotenv.config();

const usePolkaVM = process.env.USE_POLKAVM === "true";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 999999,
      },
    }
  },
  resolc: {
    compilerSource: "binary",
    settings: {
      compilerPath: "resolc-0.3.0",
    },
  },
  mocha: {
    timeout: 100000
  },
  networks: {
    hardhat: usePolkaVM
      ? {
          polkavm: true,
          nodeConfig: {
            nodeBinaryPath: "../revive-dev-node",
            rpcPort: 8000,
            dev: true,
          },
          adapterConfig: {
            adapterBinaryPath: "../eth-rpc",
            dev: true,
          },
        }
      : {
        allowUnlimitedContractSize: true,
      },
    local: {
      // polkavm: true,
      url: 'http://localhost:8545',
      accounts: [
        '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
        '0x8075991ce870b93a8870eca0c0f91913d12f47948ca0fd25b49c6fa7cdbeee8b'
      ],
    },
  }
};

export default config;
