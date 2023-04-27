// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const config = require('../src/config.json')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens
const shares = ether

async function main() {

  // Fetch accounts
  console.log(`Fetching accounts & network`)
  const accounts = await ethers.getSigners()
  const deployer = accounts[0]
  const swapper1 = accounts[1]
  const investor2 = accounts[2]
  const investor3 = accounts[3]
  const investor4 = accounts[4]

  // Fetch Network
  const { chainId } = await ethers.provider.getNetwork()

  console.log(`Fetching token and transferring to accounts...`)

  // Fetch Dapp Token
  const dapp = await ethers.getContractAt('Token', config[chainId].dapp.address)
  console.log(`Dapp Token fetched: ${dapp.address}`)

  // Fetch USD Token
  const usd = await ethers.getContractAt('Token', config[chainId].usd.address)
  console.log(`USD Token fetched: ${usd.address}`)


  /////////////////////////////////////////////////////////////
  // Distribute Tokens to Investors
  //

  let transaction

  // Send dapp tokens to investor 1
  transaction = await dapp.connect(deployer).transfer(swapper1.address, tokens(10000))
  await transaction.wait()

  transaction = await usd.connect(deployer).transfer(swapper1.address, tokens(10000))
  await transaction.wait()

  // // Send dapp tokens to investor 3
  // transaction = await dapp.connect(deployer).transfer(investor3.address, tokens(100))
  // await transaction.wait()

  // // Send usd tokens to investor 4
  // transaction = await usd.connect(deployer).transfer(investor4.address, tokens(100))
  // await transaction.wait()


  /////////////////////////////////////////////////////////////
  // Adding Liquidity
  //

  let amount = tokens(10000)
  let liquidityAmounts

  console.log(`Fetching AMM...`)

  // Fetch AMM
  const amm = await ethers.getContractAt('AMM', config[chainId].amm.address)
  console.log(`AMM fetched: ${amm.address}`)

  transaction = await dapp.connect(deployer).approve(amm.address, amount)
  await transaction.wait()

  transaction = await usd.connect(deployer).approve(amm.address, amount)
  await transaction.wait()

  // Deployer adds liquidity
  console.log(`Adding liquidity...`)
  amount = tokens(1000)
  liquidityAmounts = { tokenAAmount: amount, tokenBAmount: amount };
  // console.log(liquidityAmounts.tokenAAmount);
  transaction = await amm.connect(deployer).addLiquidityWith(liquidityAmounts)
  await transaction.wait()
      console.log(`AMM token balance A / B : ${(await amm.tokenABalance())*1e-18} / ${(await amm.tokenBBalance())*1e-18}`)
      console.log(`Price: ${await amm.tokenBBalance() / await amm.tokenABalance()}\n`)
        console.log(`deployer shares${(await amm.shares(deployer.address))*1e-18}`)
        console.log(`investor shares${(await amm.shares(swapper1.address))*1e-18}`)
        console.log(`total shares${(await amm.totalShares())*1e-18}`)


  /////////////////////////////////////////////////////////////
  // Deployer Swaps: Dapp --> USD
  //

  console.log(`Deployer Swaps...\n`)

  // Investor approves all tokens
  transaction = await dapp.connect(deployer).approve(amm.address, tokens(100))
  transaction = await usd.connect(deployer).approve(amm.address, tokens(100))
  await transaction.wait()
  let swapAmount = tokens(10)
    console.log(`Approval done\n`)

  // Investor swapstoken
  console.log(swapAmount)
  transaction = await amm.connect(deployer).swapTokens(true, swapAmount)
  await transaction.wait()
        console.log(`Swap done\n`)

  // Investor swaps 1 token
  transaction = await amm.connect(deployer).swapTokens(false, tokens(12))
  await transaction.wait()
        console.log(`Swap done\n`)

  console.log
  (`Deployer token balance A / B : 
    ${(await dapp.balanceOf(deployer.address))*1e-18} / 
    ${(await usd.balanceOf(deployer.address))*1e-18}`)

  /////////////////////////////////////////////////////////////
  // Investor 1 Swaps: Dapp --> USD
  //

  console.log(`Swapper 1 Swaps...\n`)

  // Investor approves all tokens
  transaction = await dapp.connect(swapper1).approve(amm.address, tokens(10))
  await transaction.wait()
    console.log(`Approval done\n`)

  console.log(swapAmount)
  transaction = await amm.connect(swapper1).swapTokens(true, tokens(10))
  await transaction.wait()
      console.log(`Swap done\n`)


  console.log
  (`Investor1 token balance A / B : 
    ${(await dapp.balanceOf(swapper1.address))*1e-18} / 
    ${(await usd.balanceOf(swapper1.address))*1e-18}`)


  // /////////////////////////////////////////////////////////////
  // // Investor 2 Swaps: USD --> Dapp
  // //

  // console.log(`Investor 2 Swaps...\n`)
  // // Investor approves all tokens tokens
  // transaction = await usd.connect(investor2).approve(amm.address, tokens(10))
  // await transaction.wait()

  // // Investor swaps 1 token
  // transaction = await amm.connect(investor2).swapToken2(tokens(1))
  // await transaction.wait()


  // /////////////////////////////////////////////////////////////
  // // Investor 3 Swaps: Dapp --> USD
  // //

  // console.log(`Investor 3 Swaps...\n`)

  // // Investor approves all tokens
  // transaction = await dapp.connect(investor3).approve(amm.address, tokens(10))
  // await transaction.wait()

  // // Investor swaps all 10 token
  // transaction = await amm.connect(investor3).swapToken1(tokens(10))
  // await transaction.wait()

  // /////////////////////////////////////////////////////////////
  // // Investor 4 Swaps: USD --> Dapp
  // //

  // console.log(`Investor 4 Swaps...\n`)

  // // Investor approves all tokens
  // transaction = await usd.connect(investor4).approve(amm.address, tokens(10))
  // await transaction.wait()

  // // Investor swaps all 10 tokens
  // transaction = await amm.connect(investor4).swapToken2(tokens(5))
  // await transaction.wait()

  console.log(`Finished.\n`)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
