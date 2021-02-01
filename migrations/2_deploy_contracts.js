const {deployProxy} = require("@openzeppelin/truffle-upgrades");
const contract = require('@truffle/contract');

const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");
const factoryJson = require('@uniswap/v2-core/build/UniswapV2Factory.json')
const routerJson = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
const BN = require("bn.js");
const UniswapV2Factory = contract(factoryJson);
const UniswapV2Router = contract(routerJson);

module.exports = async function (deployer, network, accounts) {
    const TOTAL_EGL_SUPPLY = new BN(web3.utils.toWei("4000000000")); // 4 billion

    let routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap Router
    let ethToLaunchUniSwap = web3.utils.toWei("1000");
    let minPoolTokensLockup = 6048000; // 10 weeks
    let firstEpochStartDate = Math.round(new Date().getTime() / 1000);
    let votePauseSeconds = 21600; // 6 hours
    let epochLengthSeconds = 604800; // 1 week
    let seedAccounts = [];
    let eglsGifted = new BN("0");
    let creatorRewardAccount = accounts[0];

    const eglToken = await deployProxy(
        EglToken,
        ["TestToken", "TTK", TOTAL_EGL_SUPPLY.toString()],
    );
    console.log("EGL Token deployed to address: ", eglToken.address);

    if (network === "ropsten") {
        giftAccounts = {
            "Uri": "0xb079b14b218013C81Fe17Cb0D4B665E448722dc5",
            "Aleks": "0xC8dbcEFD80aA21f0Edb1B4F2cF16F26022620382",
            "Eleni": "0xB04Ad04A2ac41dBbe8be06EE8938318575bb5E4b",
            "Eyal": "0x2C596F42d15848b6dD997B255B9c033Ce7240644",
            "Shane": "0x2755f888047Db8E3d169C6A427470C44b19a7270",
        }
        for (let [name, address] of Object.entries(giftAccounts)) {
            await eglToken.transfer(address, web3.utils.toWei("50000000"));
            console.log("Token balance for '" + name + "': ", (await eglToken.balanceOf(address)).toString());
            eglsGifted = eglsGifted.add(new BN(web3.utils.toWei("50000000")));
        }

        ethToLaunchUniSwap = web3.utils.toWei("5");
        minPoolTokensLockup = 10800; // 3 hours 
        votePauseSeconds = 300; // 5 minutes
        epochLengthSeconds = 3600; // 1 hour
        seedAccounts = [];
        creatorRewardAccount = accounts[0];
    }

    if (network === "ganache") {
        giftAccounts = {
            "Account 1": accounts[1],
            "Account 2": accounts[2],
        }
        
        for (let [name, address] of Object.entries(giftAccounts)) {
            await eglToken.transfer(address, web3.utils.toWei("50000000"));
            console.log("Token balance for '" + name + "': ", (await eglToken.balanceOf(address)).toString());
            eglsGifted = eglsGifted.add(new BN(web3.utils.toWei("50000000")));
        }
        ethToLaunchUniSwap = web3.utils.toWei("1");
        minPoolTokensLockup = 360; // 6 minutes
        votePauseSeconds = 60; // 1 minute
        epochLengthSeconds = 300; // 5 minutes
        seedAccounts = [accounts[1], accounts[2]];
        creatorRewardAccount = accounts[9];
        
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
            eglsGifted.toString(),
            creatorRewardAccount
        ],
        {deployer, unsafeAllowCustomTypes: true}
    );
    console.log("EGL Contract deployed to address: ", eglContract.address);

    // Transfer all tokens to EGL contract
    await eglToken.transfer(eglContract.address, TOTAL_EGL_SUPPLY.sub(eglsGifted).toString());

    // TODO: Fix this ownership call
    // Owns itself - and is the only one that can initiate upgrades
    // await eglContract.transferOwnership(eglContract.address);
};
