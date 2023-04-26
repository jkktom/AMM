require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
    tests: "./test",
    imports: "./imports",
  },
  overrides: {
    "contracts/amm.sol": {
      version: "0.8.9",
    },
  },
};
