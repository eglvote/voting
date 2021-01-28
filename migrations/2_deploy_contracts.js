const {deployProxy} = require("@openzeppelin/truffle-upgrades");
const contract = require('@truffle/contract');

const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");
const factoryJson = require('@uniswap/v2-core/build/UniswapV2Factory.json')
const routerJson = require('@uniswap/v2-periphery/build/UniswapV2Router02.json')
const UniswapV2Factory = contract(factoryJson);
const UniswapV2Router = contract(routerJson);

module.exports = async function (deployer, network, accounts) {
    const TOTAL_EGL_SUPPLY = web3.utils.toWei("4000000000"); // 4 billion

    let routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap Router
    let ethToLaunchUniSwap = web3.utils.toWei("2");
    let minPoolTokensLockup = 1800;
    let firstEpochStartDate = Math.round(new Date().getTime() / 1000);
    let votePauseSeconds = 60;
    let epochLengthSeconds = 300;
    let seedAccounts = [];
    let creatorRewardAccount = accounts[9];

    const eglToken = await deployProxy(
        EglToken,
        ["TestToken", "TTK", TOTAL_EGL_SUPPLY],
    );
    console.log("EGL Token deployed to address: ", eglToken.address);

    if (network === "ganache") {
        UniswapV2Factory.setProvider(this.web3._provider);
        UniswapV2Router.setProvider(this.web3._provider);

        await deployer.deploy(UniswapV2Factory, accounts[0], {from: accounts[0]});
        let factoryContract = await UniswapV2Factory.deployed();
        let wethContract = await EglToken.new();
        await deployer.deploy(UniswapV2Router, factoryContract.address, wethContract.address, {from: accounts[0]});
        let routerContract = await UniswapV2Router.deployed();
        routerAddress = routerContract.address;
    }

    const eglContract = await deployProxy(
        EglContract,
        [
            eglToken.address,
            routerAddress,
            ethToLaunchUniSwap,
            minPoolTokensLockup,
            firstEpochStartDate,
            votePauseSeconds,
            epochLengthSeconds,
            seedAccounts,
            creatorRewardAccount
        ],
        {deployer, unsafeAllowCustomTypes: true}
    );
    console.log("EGL Contract deployed to address: ", eglContract.address);

    // Transfer all tokens to EGL contract
    await eglToken.transfer(eglContract.address, TOTAL_EGL_SUPPLY);

    // TODO: Fix this ownership call
    // Owns itself - and is the only one that can initiate upgrades
    // await eglContract.transferOwnership(eglContract.address);

    // FOR TESTING ONLY
    // await eglContract.giveTokens("0xb079b14b218013C81Fe17Cb0D4B665E448722dc5"); // Uri
    // console.log("Token balance for Uri:", (await eglToken.balanceOf("0xb079b14b218013C81Fe17Cb0D4B665E448722dc5")).toString())

    // await eglContract.giveTokens("0xC8dbcEFD80aA21f0Edb1B4F2cF16F26022620382"); // Aleks
    // console.log("Token balance for Aleks:", (await eglToken.balanceOf("0xC8dbcEFD80aA21f0Edb1B4F2cF16F26022620382")).toString())

    // await eglContract.giveTokens("0xB04Ad04A2ac41dBbe8be06EE8938318575bb5E4b"); // Eleni
    // console.log("Token balance for Eleni:", (await eglToken.balanceOf("0xB04Ad04A2ac41dBbe8be06EE8938318575bb5E4b")).toString())

    // await eglContract.giveTokens("0x2C596F42d15848b6dD997B255B9c033Ce7240644"); // Eyal
    // console.log("Token balance for Eyal:", (await eglToken.balanceOf("0x2C596F42d15848b6dD997B255B9c033Ce7240644")).toString())

    // await eglContract.giveTokens("0x2755f888047Db8E3d169C6A427470C44b19a7270"); // Shane
    // console.log("Token balance for Shane:", (await eglToken.balanceOf("0x2755f888047Db8E3d169C6A427470C44b19a7270")).toString());

    await eglContract.giveTokens(accounts[1]); // Ganache
    console.log("Token balance for account 1:", (await eglToken.balanceOf(accounts[1])).toString());
};
