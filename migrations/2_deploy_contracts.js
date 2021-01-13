const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

module.exports = async function(deployer) {
  const eglToken = await deployProxy(
      EglToken,
      [
          "EthereumGasLimit",
          "EGL",
          web3.utils.toWei("4000000000") // 4 billion
      ],
      { deployer, unsafeAllowCustomTypes: true }
  );
  console.log("EGL Token deployed to address ", eglToken.address);

  let firstEpochStartDate = Math.round(new Date().getTime() / 1000);
  let votePauseSeconds = 21600; // 6 hours
  const eglContract = await deployProxy(
      EglContract,
      [
          eglToken.address,
          "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Uniswap Factory
          "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap Router
          firstEpochStartDate,
          votePauseSeconds
      ],
      { deployer, unsafeAllowCustomTypes: true }
  );
  console.log("EGL Contract deployed to address ", eglContract.address);

  // TODO: Remove ownership of deployer address
  // TODO: Grant `DEFAULT_ADMIN_ROLE` and `PAUSER_ROLE` to the Egl Contract
  // TODO: Revoke `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE` and `PAUSER_ROLE` roles from deployer
};
