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
      let transaction = await token1.connect(deployer).transfer(investor.address, tokens(200000))
      await transaction.wait()
      transaction = await token2.connect(deployer).transfer(investor.address, tokens(200000))
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
    let lpAmounts

    it('Lets have some LPing and swaps', async () => {
      //Deployer LPing 100k both tokens
        amount = tokens(100000)
         liquidityAmounts = { tokenAAmount: amount, tokenBAmount: amount };
        await (await token1.connect(deployer).approve(amm.address, amount)).wait()
        await (await token2.connect(deployer).approve(amm.address, amount)).wait()
        console.log(`deployer adds LP 100k to the pool`)
        await (await amm.connect(deployer).addLiquidityWith(liquidityAmounts)).wait()


        // console.log((await amm.tokenABalance())*1e-18)
        // console.log((await amm.tokenBBalance())*1e-18)
        // console.log((await amm.shares(deployer.address))*1e-18)
        // console.log((await amm.totalShares())*1e-18)

      //   //Invesstor puts 50k more to the pool
        console.log(`Investor adds 50k more to the pool`)
        amount = tokens(50000)

        await (await token1.connect(investor).approve(amm.address, amount)).wait()
        await (await token2.connect(investor).approve(amm.address, amount)).wait()

          ////////////////////////////////////////
          //calculating token deposit

          // Calculate Token - opposite pair and make struct
          result = await amm.calculateTokenDeposit(true, amount);
          console.log((amount)*1e-18)
          console.log((result)*1e-18)

            //LPing as per the calculation
            await (await amm.connect(investor).addLiquidityWith({tokenAAmount: amount, tokenBAmount: result})).wait()

            // console.log(`Investor adds another 50k more to the pool`)
            // await (await token1.connect(investor).approve(amm.address, amount)).wait()
            // await (await token2.connect(investor).approve(amm.address, amount)).wait()
            // lpAmounts = { tokenAAmount: amount, tokenBAmount: amount };
            // await (await amm.connect(investor).addLiquidityWith(lpAmounts)).wait()
            // console.log(lpAmounts.tokenAAmount)
            // console.log(lpAmounts)
            // console.log((await amm.tokenABalance())*1e-18)
            // console.log((await amm.tokenBBalance())*1e-18)
            // console.log((await amm.shares(deployer.address))*1e-18)
            // console.log((await amm.shares(investor.address))*1e-18)
            // console.log((await amm.totalShares())*1e-18)

      //   console.log(`${(await amm.tokenABalance())*1e-18}`)
      //   console.log(`${(await amm.tokenBBalance())*1e-18}`)
      //   console.log(`Price: ${await amm.tokenBBalance() / await amm.tokenABalance()}\n`)

      // // ///////////////////
      // // ///Swapping begins
      // // Swapper1 approves all tokens
      transaction = await token1.connect(swapper1).approve(amm.address, tokens(100000))
      await transaction.wait()


      // //Check Swapper1 balance before swap
      // balance = await token2.balanceOf(swapper1.address)
      // console.log(`Swapper 1 Token2 B: ${balance*1e-18}`)
      //   let swapAmount = tokens(50000)
      // estimate = await amm.calculateDispense(true, swapAmount)
      // result = ethers.utils.formatUnits(estimate[0].toString(), 'ether')
      //   console.log(result)
      // // console.log(`Swapper 1 Token2 E: ${estimate[0]*1e-18}`)
      // // console.log(`Swapper 1 Token2 E: ${estimate[1]*1e-18}`)
      // // console.log(`Swapper 1 Token2 E: ${estimate[2]*1e-18}`)
      // // console.log(`Swapper 1 swap 20k token1 and take token2`)
      // transaction = await amm.connect(swapper1).swapTokens(true, swapAmount)
      // await transaction.wait()

       // test.js
// Check Swapper1 balance before swap
balance = await token2.balanceOf(swapper1.address);
console.log(`Swapper 1 Token2 B: ${balance * 1e-18}`);
let swapAmount = tokens(50000);

estimate = await amm.calculateDispense(true, swapAmount);

console.log(`Swapper 1 Token2 E: ${ethers.utils.formatUnits(estimate[0].toString(), 'ether')}`);
console.log(`New Balance of Token A: ${ethers.utils.formatUnits(estimate[1].toString(), 'ether')}`);
console.log(`New Balance of Token B: ${ethers.utils.formatUnits(estimate[2].toString(), 'ether')}`);

// console.log(`Swapper 1 swap 20k token1 and take token2`);
transaction = await amm.connect(swapper1).swapTokens(true, swapAmount);
await transaction.wait();



      console.log(`amm token a${(await amm.tokenABalance())*1e-18}`)
      console.log(`b${(await amm.tokenBBalance())*1e-18}`)
      // console.log(`Price: ${await amm.tokenBBalance() / await amm.tokenABalance()}\n`)

      balance = await token2.balanceOf(swapper1.address)
      console.log(`Swapper 1 Token2 B: ${balance*1e-18}`)
      // balance = await token1.balanceOf(swapper1.address)
      // console.log(`Swapper 1 Token1 B: ${balance*1e-18}\n`)

      // // Check EMIT
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


      // console.log(`investor withdraw 10shares LP Pool`)
      //     await (await amm.connect(investor).withdrawLiquidity(shares(10))).wait()

      //   balance = await token1.balanceOf(investor.address)
      //     console.log(`investor token 1 B : ${balance*1e-18}`)
      //   balance = await token2.balanceOf(investor.address)
      //     console.log(`investor token 2 B : ${balance*1e-18}`)
      //   console.log(`${(await amm.tokenABalance())*1e-18}`)
      //   console.log(`${(await amm.tokenBBalance())*1e-18}`)
      //   console.log(`Price: ${await amm.tokenBBalance() / await amm.tokenABalance()}\n`)

      //   console.log((await amm.shares(deployer.address))*1e-18)
      //   console.log((await amm.shares(investor.address))*1e-18)
      //   console.log((await amm.totalShares())*1e-18)

      // //Invesstor puts 50k more to the pool
      //   amount = tokens(50000)
      //   liquidityAmounts = await amm.calculateTokenDeposit(amount, token1.address);
      //   await (await token1.connect(investor).approve(amm.address, liquidityAmounts.tokenAAmount)).wait()
      //   await (await token2.connect(investor).approve(amm.address, liquidityAmounts.tokenBAmount)).wait()

      //   console.log(`investor puts 50K LP Pool`)
      //     await (await amm.connect(investor).addLiquidity(liquidityAmounts)).wait()

      //   console.log((await amm.shares(deployer.address))*1e-18)
      //   console.log((await amm.shares(investor.address))*1e-18)
      //   console.log((await amm.totalShares())*1e-18)
      //       // balance = await token1.balanceOf(investor.address)
      //       //   console.log(`investor token 1 B : ${balance*1e-18}`)
      //       // balance = await token2.balanceOf(investor.address)
      //       //   console.log(`investor token 2 B : ${balance*1e-18}`)
      //       // console.log(`${(await amm.tokenABalance())*1e-18}`)
      //       // console.log(`${(await amm.tokenBBalance())*1e-18}`)
      //       // console.log(`Price: ${await amm.tokenBBalance() / await amm.tokenABalance()}\n`)

      //       // console.log((await amm.shares(deployer.address))*1e-18)
      //       // console.log((await amm.shares(investor.address))*1e-18)
      //       // console.log((await amm.tokenABalance())*1e-18)

      //       // console.log((await amm.tokenBBalance())*1e-18)


    })
  })
})
