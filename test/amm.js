const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens
const shares = ether

describe('AMM', () => {
  let accounts,
      deployer,
      investor,
      swaper1,
      swaper2
  let token1,
      token2,
      amm

  beforeEach(async() => {
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    investor = accounts[1]
     swaper1 = accounts[2]
     swaper2 = accounts[3]

    //Deploy Token
    const Token = await ethers.getContractFactory('Token')
    token1 = await Token.deploy('Dapp University', 'Dapp', '1000000')
    token2 = await Token.deploy('USD Token', 'USD', '1000000')

    // Send tokens to liquidity provider (eg investor)
    let transaction = await token1.connect(deployer).transfer(investor.address, tokens(100000))
    await transaction.wait()
    transaction = await token2.connect(deployer).transfer(investor.address, tokens(100000))
    await transaction.wait()

    // swaper 1 gets token1
    transaction = await token1.connect(deployer).transfer(swaper1.address, tokens(100000))
    await transaction.wait()
    //swaper 2 gets token 2
    transaction = await token2.connect(deployer).transfer(swaper2.address, tokens(100000))
    await transaction.wait()

    const AMM = await ethers.getContractFactory('AMM')
    amm = await AMM.deploy(token1.address, token2.address)
  })

  describe('Deployment', () => {
    it('has an address', async() => {
      console.log(amm.address)
      console.log(await amm.tokenA())
      console.log(token1.address)
      console.log(await amm.tokenB())
      console.log(token2.address)

    })
  })

  describe('Swapping tokens', () => {
    let amount, transaction, result, estimate, balance

    it('Lets have some LPing and swaps', async () => {
      //Deployer approves 100k both tokens
      amount = tokens(100000)
      await (await token1.connect(deployer).approve(amm.address, amount)).wait()
      await (await token2.connect(deployer).approve(amm.address, amount)).wait()
      await (await amm.connect(deployer).addLiquidity(amount, amount)).wait()
      // console.log((await amm.tokenABalance())*1e-18)
      // console.log((await amm.tokenBBalance())*1e-18)
      // console.log((await amm.shares(deployer.address))*1e-18)
      // console.log((await amm.totalShares())*1e-18)

      //Invesstor puts 50k more to the pool
      amount = tokens(50000)
      await (await token1.connect(investor).approve(amm.address, amount)).wait()
      await (await token2.connect(investor).approve(amm.address, amount)).wait()
      await (await amm.connect(investor).addLiquidity(amount, amount)).wait()
      // console.log((await amm.tokenABalance())*1e-18)
      // console.log((await amm.tokenBBalance())*1e-18)
      // console.log((await amm.shares(investor.address))*1e-18)
      // console.log((await amm.shares(deployer.address))*1e-18)
      // console.log((await amm.totalShares())*1e-18)
    })
  })


})























