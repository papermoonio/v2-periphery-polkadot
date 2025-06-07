// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@uniswap/v2-core/contracts/UniswapV2Factory.sol";

contract UniswapV2FactoryExample is UniswapV2Factory {
    constructor(address _feeToSetter) UniswapV2Factory(_feeToSetter) {}
}
