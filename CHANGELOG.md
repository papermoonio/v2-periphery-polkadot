# Changelog

## Modification Record

| Change Type                     | Description & Cause                                                                                            | Files Affected                                                                                                                                                                                                                                                                                                                              |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Solidity Version Upgrade**    | Solidity version upgraded from 0.5.x to 0.8.x                                                                  |                                                                                                                                                                                                                                                                                                                                             |
| **Test Workflow**               | 1. Test framework migrates from Waffle to Hardhat, <br>2. ethersv5 upgrade to ethersv6                         | test/shared/\*, <br> test/ExampleComputeLiquidityValue.spec.ts, <br>test/UExampleSlidingWindowOracle.spec.ts, <br> test/UniswapV2Router01.spec.ts, <br>test/ExampleFlashSwap.spec.ts, <br> test/ExampleSwapToPrice.spec.ts, <br> test/UniswapV2Router02.spec.ts, <br> test/ExampleOracleSimple.spec.ts, <br> test/UniswapV2Migrator.spec.ts |
| **Contract Logic Modification** | Core changes to smart contract logic due to a fundamental incompatibility between the EVM and PolkaVM runtime. | contracts/libraries/UniswapV2Library.sol                                                                                                                                                                                                                                                                                                    |

---

## Issue Reporting

### [v2-periphery-polkadot] fields had validation errors

#### Description

When running `npx hardhat test`, a vague "fields had validation errors" message appears without further details.

#### Analysis

After debugging, it was discovered that the root cause is a `CodeSizeLimit` error during contract deployment. The error message is likely being obscured due to version incompatibilities between `hardhat-polkadot` and `hardhat`, making it difficult to diagnose.

### [v2-periphery-polkadot] PrecisionLoss

#### Description

When running removeLiquidityETH tests in v2-periphery, transactions revert due to a DecimalPrecisionLoss error originating from the Substrate runtime. This occurs during value conversions between ETH (18 decimals) and DOT (12 decimals).

#### Analysis

In this test case, the Substrate runtime rejects conversions with a remainder, e.g., converting 3999999999999998000 wei (ETH) to DOT results in a remainder of 998000 wei, which cannot be represented in DOT’s 12-decimal system.

- ETH value: 3999999999999998000 (wei)
- Conversion: ETH (1e18) → DOT (1e12) requires division by 1e6.
- Result: 3999999999999998000 / 1e6 = 3999999999999.998 → Remainder 998000 (unrepresentable in DOT).
