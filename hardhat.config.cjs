/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  paths: {
    sources: "./contract",
    tests: "./contract",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
