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
      swapper1,
      swapper2

  let token1,
      token2,
      amm

  beforeEach(async() => {
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    investor = accounts[1]
    swapper1 = accounts[2]
    swapper2 = accounts[3]

    //Deploy Token
    const Token = await ethers.getContractFactory('Token')
    token1 = await Token.deploy('Dapp University', 'Dapp', '1000000')
    token2 = await Token.deploy('USD Token', 'USD', '1000000')

    // Send tokens to liquidity provider (eg investor)
    let transaction = await token1.connect(deployer).transfer(investor.address, tokens(100000))
    await transaction.wait()
    transaction = await token2.connect(deployer).transfer(investor.address, tokens(100000))
    await transaction.wait()

    // swapper 1 gets token1
    transaction = await token1.connect(deployer).transfer(swapper1.address, tokens(100000))
    await transaction.wait()
    //swapper 2 gets token 2
    transaction = await token2.connect(deployer).transfer(swapper2.address, tokens(100000))
    await transaction.wait()

    const AMM = await ethers.getContractFactory('AMM')
    amm = await AMM.deploy(token1.address, token2.address)
  })

  describe('Deployment', () => {
    it('has an address', async() => {
      // console.log(amm.address)
      // console.log(await amm.tokenA())
      // console.log(token1.address)
      // console.log(await amm.tokenB())
      // console.log(token2.address)

    })
  })

  describe('Swapping tokens', () => {
    let amount, transaction, result, estimate, balance, liquidityAmounts

    it('Lets have some LPing and swaps', async () => {
      //Deployer approves 100k both tokens
      amount = tokens(100000)
       liquidityAmounts = { tokenAAmount: amount, tokenBAmount: amount };
      await (await token1.connect(deployer).approve(amm.address, amount)).wait()
      await (await token2.connect(deployer).approve(amm.address, amount)).wait()
      console.log(`deployer adds LP 100k to the pool`)
      await (await amm.connect(deployer).addLiquidity(liquidityAmounts)).wait()
      // console.log((await amm.tokenABalance())*1e-18)
      // console.log((await amm.tokenBBalance())*1e-18)
      // console.log((await amm.shares(deployer.address))*1e-18)
      // console.log((await amm.totalShares())*1e-18)

      //Invesstor puts 50k more to the pool
      console.log(`Investor adds 50k more to the pool`)
      amount = tokens(50000)
      // liquidityAmounts = { tokenAAmount: amount, tokenBAmount: amount };
      await (await token1.connect(investor).approve(amm.address, amount)).wait()
      await (await token2.connect(investor).approve(amm.address, amount)).wait()

        ////////////////////////////////////////
        //calculating token deposit

        // Calculate Token - opposite pair and make struct
        liquidityAmounts = await amm.calculateTokenDeposit(amount, token1.address);
        // liquidityAmounts = { tokenAAmount: amount, tokenBAmount: amount };
        // console.log((liquidityAmounts.tokenAAmount)*1e-18)
        // console.log((liquidityAmounts.tokenBAmount)*1e-18)

          //LPing as per the calculation
          await (await amm.connect(investor).addLiquidity(liquidityAmounts)).wait()
          // console.log((await amm.tokenABalance())*1e-18)
          // console.log((await amm.tokenBBalance())*1e-18)
          // console.log((await amm.shares(deployer.address))*1e-18)
          // console.log((await amm.shares(investor.address))*1e-18)
          // console.log((await amm.totalShares())*1e-18)

      console.log(`${(await amm.tokenABalance())*1e-18}`)
      console.log(`${(await amm.tokenBBalance())*1e-18}`)
      console.log(`Price: ${await amm.tokenBBalance() / await amm.tokenABalance()}\n`)

      //Swapper1 approves all tokens
      transaction = await token1.connect(swapper1).approve(amm.address, tokens(100000))
      await transaction.wait()

      //Check Swapper1 balance before swap
      // balance = await token2.balanceOf(swapper1.address)
      // console.log(`Swapper 1 Token2 B: ${balance*1e-18}`)
        let swapAmount = tokens(20000)
      // estimate = await amm.calculateTokenBSwap(swapAmount)
      // console.log(`Swapper 1 Token2 E: ${estimate*1e-18}`)
      console.log(`Swapper 1 swap 20k token1 and take token2`)
      transaction = await amm.connect(swapper1).swapTokenA(swapAmount)
      await transaction.wait()

      console.log(`${(await amm.tokenABalance())*1e-18}`)
      console.log(`${(await amm.tokenBBalance())*1e-18}`)
      console.log(`Price: ${await amm.tokenBBalance() / await amm.tokenABalance()}\n`)

      // balance = await token2.balanceOf(swapper1.address)
      // console.log(`Swapper 1 Token2 B: ${balance*1e-18}`)
      // balance = await token1.balanceOf(swapper1.address)
      // console.log(`Swapper 1 Token1 B: ${balance*1e-18}`)

      // Check EMIT
      // await expect(transaction).to.emit(amm, 'Swap')
      //   .withArgs(
      //     swapper1.address,
      //     token1.address,
      //     swapAmount,
      //     token2.address,
      //     estimate,
      //     await amm.tokenABalance(),
      //     await amm.tokenBBalance(),
      //     (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      //   )
      // console.log((await amm.tokenABalance())*1e-18)
      // console.log((await amm.tokenBBalance())*1e-18)

      // console.log(`Price: ${await amm.tokenBBalance() / await amm.tokenABalance()}\n`)

      // //Swapper2 approves all tokens2
      // transaction = await token2.connect(swapper2).approve(amm.address, tokens(100000))
      // await transaction.wait()

      // //Check Swapper2 balance before swap
      // balance = await token1.balanceOf(swapper2.address)
      // console.log(`Swapper 2 Token1 B: ${balance*1e-18}`)
        
      //   swapAmount = tokens(1)
      // estimate = await amm.calculateTokenBSwap(swapAmount)
      // console.log(`Swapper 2 Token1 E: ${estimate*1e-18}`)

      // transaction = await amm.connect(swapper2).swapTokenB(swapAmount)
      // await transaction.wait()
      // balance = await token1.balanceOf(swapper2.address)
      // console.log(`Swapper 2 Token1 B: ${balance*1e-18}`)
      // balance = await token2.balanceOf(swapper2.address)
      // console.log(`Swapper 2 Token2 B: ${balance*1e-18}`)

      // // Check EMIT
      // await expect(transaction).to.emit(amm, 'Swap')
      //   .withArgs(
      //     swapper2.address,
      //     token2.address,
      //     swapAmount,
      //     token1.address,
      //     estimate,
      //     await amm.tokenABalance(),
      //     await amm.tokenBBalance(),
      //     (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      //   )
      // console.log((await amm.tokenABalance())*1e-18)
      // console.log((await amm.tokenBBalance())*1e-18)
      // console.log(`Price: ${await amm.tokenBBalance() / await amm.tokenABalance()}\n`)

      // balance = await token1.balanceOf(investor.address)
      //   console.log(`investor token 1 B : ${balance*1e-18}`)
      // balance = await token2.balanceOf(investor.address)
      //   console.log(`investor token 2 B : ${balance*1e-18}`)

      console.log(`investor withdraw 40k LP Pool`)
        await (await amm.connect(investor).withdrawLiquidity(shares(40))).wait()

      balance = await token1.balanceOf(investor.address)
        console.log(`investor token 1 B : ${balance*1e-18}`)
      balance = await token2.balanceOf(investor.address)
        console.log(`investor token 2 B : ${balance*1e-18}`)
      console.log(`${(await amm.tokenABalance())*1e-18}`)
      console.log(`${(await amm.tokenBBalance())*1e-18}`)
      console.log(`Price: ${await amm.tokenBBalance() / await amm.tokenABalance()}\n`)

      console.log((await amm.shares(deployer.address))*1e-18)
      console.log((await amm.shares(investor.address))*1e-18)
      console.log((await amm.totalShares())*1e-18)

      //Invesstor puts 50k more to the pool
        amount = tokens(50000)
        liquidityAmounts = await amm.calculateTokenDeposit(amount, token1.address);
        await (await token1.connect(investor).approve(amm.address, liquidityAmounts.tokenAAmount)).wait()
        await (await token2.connect(investor).approve(amm.address, liquidityAmounts.tokenBAmount)).wait()

        console.log(`investor puts 50K LP Pool`)
          await (await amm.connect(investor).addLiquidity(liquidityAmounts)).wait()

            // balance = await token1.balanceOf(investor.address)
            //   console.log(`investor token 1 B : ${balance*1e-18}`)
            // balance = await token2.balanceOf(investor.address)
            //   console.log(`investor token 2 B : ${balance*1e-18}`)
            // console.log(`${(await amm.tokenABalance())*1e-18}`)
            // console.log(`${(await amm.tokenBBalance())*1e-18}`)
            // console.log(`Price: ${await amm.tokenBBalance() / await amm.tokenABalance()}\n`)

            // console.log((await amm.shares(deployer.address))*1e-18)
            // console.log((await amm.shares(investor.address))*1e-18)
            // console.log((await amm.tokenABalance())*1e-18)

            // console.log((await amm.tokenBBalance())*1e-18)


    })
  })
})
