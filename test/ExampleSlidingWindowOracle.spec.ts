// import '@nomicfoundation/hardhat-chai-matchers'
// import { expect } from 'chai'
// import { ethers } from 'hardhat'
// import { Contract } from 'ethers'
// import { expandTo18Decimals, mineBlock, encodePrice } from './shared/utilities'
// import { v2Fixture } from './shared/fixtures'

// const defaultToken0Amount = expandTo18Decimals(5)
// const defaultToken1Amount = expandTo18Decimals(10)

// describe('ExampleSlidingWindowOracle', () => {
//   let token0: Contract
//   let token1: Contract
//   let pair: Contract
//   let weth: Contract
//   let factory: Contract
//   let wallet: any

//   async function addLiquidity(amount0 = defaultToken0Amount, amount1 = defaultToken1Amount) {
//     const bn0 = BigInt(amount0)
//     const bn1 = BigInt(amount1)
//     if (bn0 !== 0n) await token0.transfer(pair.address, bn0)
//     if (bn1 !== 0n) await token1.transfer(pair.address, bn1)
//     await pair.sync()
//   }

//   const defaultWindowSize = 86400 // 24 hours
//   const defaultGranularity = 24 // 1 hour each

//   function observationIndexOf(
//     timestamp: number,
//     windowSize: number = defaultWindowSize,
//     granularity: number = defaultGranularity
//   ): number {
//     const periodSize = Math.floor(windowSize / granularity)
//     const epochPeriod = Math.floor(timestamp / periodSize)
//     return epochPeriod % granularity
//   }

//   async function deployOracle(windowSize: number, granularity: number) {
//     const ExampleSlidingWindowOracle = await ethers.getContractFactory('ExampleSlidingWindowOracle')
//     let exampleSlidingWindowOracle = await ExampleSlidingWindowOracle.deploy(await factory.getAddress(), windowSize, granularity)
//     await exampleSlidingWindowOracle.waitForDeployment()
//     return exampleSlidingWindowOracle
//   }

//   beforeEach('deploy fixture', async function() {
//     [wallet] = await ethers.getSigners()
//     const fixture = await v2Fixture()
//     token0 = fixture.token0
//     token1 = fixture.token1
//     pair = fixture.pair
//     weth = fixture.WETH
//     factory = fixture.factoryV2
//   })

//   // 1/1/2020 @ 12:00 am UTC
//   const startTime = 1577836800

//   beforeEach(`set start time to ${startTime}`, async () => {
//     await mineBlock(startTime)
//   })

//   it('requires granularity to be greater than 0', async () => {
//     await expect(deployOracle(defaultWindowSize, 0)).to.be.revertedWith('SlidingWindowOracle: GRANULARITY')
//   })

//   it('requires windowSize to be evenly divisible by granularity', async () => {
//     await expect(deployOracle(defaultWindowSize - 1, defaultGranularity)).to.be.revertedWith(
//       'SlidingWindowOracle: WINDOW_NOT_EVENLY_DIVISIBLE'
//     )
//   })

//   it('computes the periodSize correctly', async () => {
//     const oracle = await deployOracle(defaultWindowSize, defaultGranularity)
//     expect(await (await oracle).periodSize()).to.eq(3600)
//     const oracleOther = await deployOracle(defaultWindowSize * 2, defaultGranularity / 2)
//     expect(await (await oracleOther).periodSize()).to.eq(3600 * 4)
//   })

//   describe('#observationIndexOf', () => {
//     it('works for examples', async () => {
//       const oracle = await deployOracle(defaultWindowSize, defaultGranularity)
//       expect(await (await oracle).observationIndexOf(0)).to.eq(0)
//       expect(await (await oracle).observationIndexOf(3599)).to.eq(0)
//       expect(await (await oracle).observationIndexOf(3600)).to.eq(1)
//       expect(await (await oracle).observationIndexOf(4800)).to.eq(1)
//       expect(await (await oracle).observationIndexOf(7199)).to.eq(1)
//       expect(await (await oracle).observationIndexOf(7200)).to.eq(2)
//       expect(await (await oracle).observationIndexOf(86399)).to.eq(23)
//       expect(await (await oracle).observationIndexOf(86400)).to.eq(0)
//       expect(await (await oracle).observationIndexOf(90000)).to.eq(1)
//     })
//     it('overflow safe', async () => {
//       const oracle = await deployOracle(25500, 255) // 100 period size
//       expect(await (await oracle).observationIndexOf(0)).to.eq(0)
//       expect(await (await oracle).observationIndexOf(99)).to.eq(0)
//       expect(await (await oracle).observationIndexOf(100)).to.eq(1)
//       expect(await (await oracle).observationIndexOf(199)).to.eq(1)
//       expect(await (await oracle).observationIndexOf(25499)).to.eq(254) // 255th element
//       expect(await (await oracle).observationIndexOf(25500)).to.eq(0)
//     })
//     it('matches offline computation', async () => {
//       const oracle = await deployOracle(defaultWindowSize, defaultGranularity)
//       for (let timestamp of [0, 5000, 1000, 25000, 86399, 86400, 86401]) {
//         expect(await (await oracle).observationIndexOf(timestamp)).to.eq(observationIndexOf(timestamp))
//       }
//     })
//   })

//   describe('#update', () => {
//     let slidingWindowOracle: any

//     beforeEach('deploy oracle', async () => {
//       slidingWindowOracle = await deployOracle(defaultWindowSize, defaultGranularity)
//     })

//     beforeEach('add default liquidity', async () => {
//       await addLiquidity()
//     })

//     it('succeeds', async () => {
//       await slidingWindowOracle.update(token0.address, token1.address)
//     })

//     it('sets the appropriate epoch slot', async () => {
//       const blockTimestamp = (await pair.getReserves())[2]
//       await slidingWindowOracle.update(token0.address, token1.address)
//       expect(await slidingWindowOracle.pairObservations(pair.address, observationIndexOf(blockTimestamp))).to.deep.eq([
//         BigInt(blockTimestamp),
//         await pair.price0CumulativeLast(),
//         await pair.price1CumulativeLast()
//       ])
//     })

//     it('gas for first update (allocates empty array)', async () => {
//       // const tx = await slidingWindowOracle.update(token0.address, token1.address)
//       // const receipt = await tx.wait()
//       // expect(receipt.gasUsed).to.eq('116816')
//     }).retries(2)

//     it('gas for second update in the same period (skips)', async () => {
//       // await slidingWindowOracle.update(token0.address, token1.address)
//       // const tx = await slidingWindowOracle.update(token0.address, token1.address)
//       // const receipt = await tx.wait()
//       // expect(receipt.gasUsed).to.eq('25574')
//     }).retries(2)

//     it('gas for second update different period (no allocate, no skip)', async () => {
//       // await slidingWindowOracle.update(token0.address, token1.address)
//       // await mineBlock(startTime + 3600)
//       // const tx = await slidingWindowOracle.update(token0.address, token1.address)
//       // const receipt = await tx.wait()
//       // expect(receipt.gasUsed).to.eq('94703')
//     }).retries(2)

//     it('second update in one timeslot does not overwrite', async () => {
//       await slidingWindowOracle.update(token0.address, token1.address)
//       const before = await slidingWindowOracle.pairObservations(pair.address, observationIndexOf(0))
//       await mineBlock(startTime + 1800)
//       await slidingWindowOracle.update(token0.address, token1.address)
//       const after = await slidingWindowOracle.pairObservations(pair.address, observationIndexOf(1800))
//       expect(observationIndexOf(1800)).to.eq(observationIndexOf(0))
//       expect(before).to.deep.eq(after)
//     })

//     it('fails for invalid pair', async () => {
//       await expect(slidingWindowOracle.update(weth.address, token1.address)).to.be.reverted
//     })
//   })

//   describe('#consult', () => {
//     let slidingWindowOracle: any

//     beforeEach('deploy oracle', async () => {
//       slidingWindowOracle = await deployOracle(defaultWindowSize, defaultGranularity)
//     })

//     beforeEach('add default liquidity', async () => {
//       await addLiquidity()
//     })

//     it('fails if previous bucket not set', async () => {
//       await slidingWindowOracle.update(token0.address, token1.address)
//       await expect(slidingWindowOracle.consult(token0.address, 0, token1.address)).to.be.revertedWith(
//         'SlidingWindowOracle: MISSING_HISTORICAL_OBSERVATION'
//       )
//     })

//     it('fails for invalid pair', async () => {
//       await expect(slidingWindowOracle.consult(weth.address, 0, token1.address)).to.be.reverted
//     })

//     describe('happy path', () => {
//       let blockTimestamp: number
//       let previousBlockTimestamp: number
//       let previousCumulativePrices: any
//       beforeEach('add some prices', async () => {
//         previousBlockTimestamp = (await pair.getReserves())[2]
//         previousCumulativePrices = [await pair.price0CumulativeLast(), await pair.price1CumulativeLast()]
//         await slidingWindowOracle.update(token0.address, token1.address)
//         blockTimestamp = previousBlockTimestamp + 23 * 3600
//         await mineBlock(blockTimestamp)
//         await slidingWindowOracle.update(token0.address, token1.address)
//       })

//       it('has cumulative price in previous bucket', async () => {
//         expect(
//           await slidingWindowOracle.pairObservations(pair.address, observationIndexOf(previousBlockTimestamp))
//         ).to.deep.eq([
//           BigInt(previousBlockTimestamp),
//           previousCumulativePrices[0],
//           previousCumulativePrices[1]
//         ])
//       })

//       it('has cumulative price in current bucket', async () => {
//         const timeElapsed = blockTimestamp - previousBlockTimestamp
//         const pricesRaw = encodePrice(defaultToken0Amount, defaultToken1Amount)
//         const prices = [
//           BigInt(pricesRaw[0]),
//           BigInt(pricesRaw[1])
//         ]
//         expect(
//           await slidingWindowOracle.pairObservations(pair.address, observationIndexOf(blockTimestamp))
//         ).to.deep.eq([
//           BigInt(blockTimestamp),
//           prices[0] * BigInt(timeElapsed),
//           prices[1] * BigInt(timeElapsed)
//         ])
//       })

//       it('provides the current ratio in consult token0', async () => {
//         expect(await slidingWindowOracle.consult(token0.address, 100, token1.address)).to.eq(76)
//       })

//       it('provides the current ratio in consult token1', async () => {
//         expect(await slidingWindowOracle.consult(token1.address, 100, token0.address)).to.eq(50)
//       })
//     })

//     describe('price changes over period', () => {
//       const hour = 3600
//       beforeEach('add some prices', async () => {
//         await slidingWindowOracle.update(token0.address, token1.address) // hour 0, 1:2
//         await mineBlock(startTime + 3 * hour)
//         await addLiquidity(defaultToken0Amount, 0n)
//         await slidingWindowOracle.update(token0.address, token1.address)

//         await mineBlock(startTime + 6 * hour)
//         await token0.transfer(pair.address, BigInt(defaultToken0Amount) * 2n)
//         await pair.sync()

//         await mineBlock(startTime + 9 * hour)
//         await slidingWindowOracle.update(token0.address, token1.address)
//         await mineBlock(startTime + 23 * hour)
//       })

//       it('provides the correct ratio in consult token0', async () => {
//         expect(await slidingWindowOracle.consult(token0.address, 100, token1.address)).to.eq(76)
//       })

//       it('provides the correct ratio in consult token1', async () => {
//         expect(await slidingWindowOracle.consult(token1.address, 100, token0.address)).to.eq(167)
//       })

//       describe('hour 32', () => {
//         beforeEach('set hour 32', async () => {
//           await mineBlock(startTime + 32 * hour)
//         })
//         it('provides the correct ratio in consult token0', async () => {
//           expect(await slidingWindowOracle.consult(token0.address, 100, token1.address)).to.eq(50)
//         })

//         it('provides the correct ratio in consult token1', async () => {
//           expect(await slidingWindowOracle.consult(token1.address, 100, token0.address)).to.eq(200)
//         })
//       })
//     })
//   })
// })
