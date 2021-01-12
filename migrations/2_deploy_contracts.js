const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

module.exports = async function(deployer) {
  const eglToken = await deployProxy(
      EglToken,
      ["EthereumGasLimit", "EGL", web3.utils.toWei("4000000000")],
      { deployer, unsafeAllowCustomTypes: true }
  );
  console.log("EGL Token deployed to address ", eglToken.address);

  const eglContract = await deployProxy(
      EglContract,
      [eglToken.address],
      { deployer, unsafeAllowCustomTypes: true }
  );
  console.log("EGL Contract deployed to address ", eglContract.address);

  // TODO: Remove ownership of deployer address
  // TODO: Grant `DEFAULT_ADMIN_ROLE` and `PAUSER_ROLE` to the Egl Contract
  // TODO: Revoke `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE` and `PAUSER_ROLE` roles from deployer
};
