const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");
const {deployProxy} = require('@openzeppelin/truffle-upgrades');

module.exports = async function (deployer, network, accounts) {
    const TOTAL_SUPPLY = web3.utils.toWei("4000000000") // 4 billion
    const eglToken = await deployProxy(
        EglToken,
        [
            "EthereumGasLimit",
            "EGL",
            TOTAL_SUPPLY
        ],
        {deployer, unsafeAllowCustomTypes: true}
    );
    console.log("EGL Token deployed to address ", eglToken.address);

    let firstEpochStartDate = Math.round(new Date().getTime() / 1000);
    // let votePauseSeconds = 21600; // 6 hours
    // let epochLengthSeconds = 604800; // 1 week
    let votePauseSeconds = 10;
    let epochLengthSeconds = 60;
    let seedAccounts = [accounts[1], accounts[2], accounts[3]];
    let creatorRewardAccount = accounts[9];
    const eglContract = await deployProxy(
        EglContract,
        [
            eglToken.address,
            "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Uniswap Factory
            "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap Router
            firstEpochStartDate,
            votePauseSeconds,
            epochLengthSeconds,
            seedAccounts,
            creatorRewardAccount
        ],
        {deployer, unsafeAllowCustomTypes: true}
    );
    console.log("EGL Contract deployed to address ", eglContract.address);

    // TEMP
    eglToken.transfer(accounts[4], web3.utils.toWei("100000000"));

    // Transfer all tokens to EGL contract
    // eglToken.transfer(eglContract.address, TOTAL_SUPPLY);
    eglToken.transfer(eglContract.address, web3.utils.toWei("3900000000"));

    // TODO: Remove ownership of deployer address
    // TODO: Grant `DEFAULT_ADMIN_ROLE` and `PAUSER_ROLE` to the Egl Contract
    // TODO: Revoke `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE` and `PAUSER_ROLE` roles from deployer
};
