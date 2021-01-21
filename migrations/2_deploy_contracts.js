const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");
const {deployProxy} = require('@openzeppelin/truffle-upgrades');

module.exports = async function (deployer, network, accounts) {
    const TOTAL_SUPPLY = web3.utils.toWei("4000000000") // 4 billion
    const eglToken = await deployProxy(
        EglToken,
        [
            "TestToken",
            "TTK",
            TOTAL_SUPPLY
        ],
        {deployer, unsafeAllowCustomTypes: true}
    );
    console.log("EGL Token deployed to address ", eglToken.address);

    let firstEpochStartDate = Math.round(new Date().getTime() / 1000);
    // let votePauseSeconds = 21600; // 6 hours
    // let epochLengthSeconds = 604800; // 1 week
    let votePauseSeconds = 60;
    let epochLengthSeconds = 300;
    let seedAccounts = [];
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

    // Transfer all tokens to EGL contract
    await eglToken.transfer(eglContract.address, TOTAL_SUPPLY);

    // FOR TESTING ONLY
    // await eglContract.giveTokens("0xb079b14b218013C81Fe17Cb0D4B665E448722dc5"); // Uri
    // console.log("Token balance for Uri:", (await eglToken.balanceOf("0xb079b14b218013C81Fe17Cb0D4B665E448722dc5")).toString())

    // await eglContract.giveTokens("0xC8dbcEFD80aA21f0Edb1B4F2cF16F26022620382"); // Aleks
    // console.log("Token balance for Aleks:", (await eglToken.balanceOf("0xC8dbcEFD80aA21f0Edb1B4F2cF16F26022620382")).toString())

    // await eglContract.giveTokens("0xB04Ad04A2ac41dBbe8be06EE8938318575bb5E4b"); // Eleni
    // console.log("Token balance for Eleni:", (await eglToken.balanceOf("0xB04Ad04A2ac41dBbe8be06EE8938318575bb5E4b")).toString())

    await eglContract.giveTokens(accounts[1]); // Ganache
    console.log("Token balance for account 1:", (await eglToken.balanceOf(accounts[1])).toString())

    // await eglContract.giveTokens("0x2C596F42d15848b6dD997B255B9c033Ce7240644"); // Eyal
    // console.log("Token balance for Eleni:", (await eglToken.balanceOf("0x2C596F42d15848b6dD997B255B9c033Ce7240644")).toString())


    // TODO: Remove ownership of deployer address
    // TODO: Grant `DEFAULT_ADMIN_ROLE` and `PAUSER_ROLE` to the Egl Contract
    // TODO: Revoke `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE` and `PAUSER_ROLE` roles from deployer
};
