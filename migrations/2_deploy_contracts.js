const BN = require("bn.js");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const Contract = require('@truffle/contract');
const FactoryJson = require('@uniswap/v2-core/build/UniswapV2Factory.json')
const RouterJson = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');

const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");
const WethToken = artifacts.require("@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol")

const UniswapV2Factory = Contract(FactoryJson);
UniswapV2Factory.setProvider(this.web3._provider);

const UniswapV2Router = Contract(RouterJson);
UniswapV2Router.setProvider(this.web3._provider);

let totalEglSupply;
let eglToken;
let eglContract;
let routerAddress;
let ethToLaunchUniSwap;
let minPoolTokensLockup;
let firstEpochStartDate;
let votePauseSeconds;
let epochLengthSeconds;
let seedAccounts;
let initialGasLimit;
let desiredEgl;
let eglsGifted;
let creatorRewardAccount;

async function giveFreeTokens(giftAccounts) {
    let giftEgls = new BN("0");
    for (let [name, address] of Object.entries(giftAccounts)) {
        await eglToken.transfer(address, web3.utils.toWei("50000000"));
        console.log("Token balance for '" + name + "': ", (await eglToken.balanceOf(address)).toString());
        giftEgls = giftEgls.add(new BN(web3.utils.toWei("50000000")));
    }
    return giftEgls;
}

module.exports = async function (deployer, network, accounts) {    
    totalEglSupply = new BN(web3.utils.toWei("4000000000")); // 4 billion

    eglToken = await deployProxy(
        EglToken,
        ["TestToken", "TTK", totalEglSupply.toString()],
    );
    console.log("EGL Token deployed to address: ", eglToken.address);

    if (network === "mainnet") {
        routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap Router
        ethToLaunchUniSwap = web3.utils.toWei("1000");
        minPoolTokensLockup = 6048000; // 10 weeks
        firstEpochStartDate = Math.round(new Date().getTime() / 1000);
        votePauseSeconds = 21600; // 6 hours
        epochLengthSeconds = 604800; // 1 week
        initialGasLimit = 12500000;
        desiredEgl = 13000000;
        seedAccounts = [];
        eglsGifted = new BN("0"); // No gift tokens in mainnet
        creatorRewardAccount = accounts[0];
    }

    if (network === "ropsten") {
        giftAccounts = {
            // "Uri": "0xb079b14b218013C81Fe17Cb0D4B665E448722dc5",
            // "Aleks": "0xC8dbcEFD80aA21f0Edb1B4F2cF16F26022620382",
            // "Eleni": "0xB04Ad04A2ac41dBbe8be06EE8938318575bb5E4b",
            // "Eyal": "0x2C596F42d15848b6dD997B255B9c033Ce7240644",
            // "Shane": "0x2755f888047Db8E3d169C6A427470C44b19a7270",
            // "Greg": "0x8E85bD36Cce941b76D1c668B282D842f867e6F0d",
        }

        routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap Router
        ethToLaunchUniSwap = web3.utils.toWei("1000");
        minPoolTokensLockup = 3600; // 1 hour 
        firstEpochStartDate = Math.round(new Date().getTime() / 1000);
        votePauseSeconds = 60; // 1 minute
        epochLengthSeconds = 600; // 10 minutes
        initialGasLimit = 8000000;
        desiredEgl = 8500000;
        seedAccounts = [
            "0x2C596F42d15848b6dD997B255B9c033Ce7240644",
            "0x2755f888047Db8E3d169C6A427470C44b19a7270",
        ];
        eglsGifted = await giveFreeTokens(giftAccounts);
        creatorRewardAccount = accounts[0];
    }

    if (network === "ganache") {
        let wethToken = await WethToken.new();
        await deployer.deploy(UniswapV2Factory, accounts[0], {from: accounts[0]});
        let factoryContract = await UniswapV2Factory.deployed();
        await deployer.deploy(UniswapV2Router, factoryContract.address, wethToken.address, {from: accounts[0]});
        let routerContract = await UniswapV2Router.deployed();

        giftAccounts = {
            "Account 3": accounts[3],
            "Account 4": accounts[4],
        }
        
        routerAddress = routerContract.address;
        ethToLaunchUniSwap = web3.utils.toWei("1");
        minPoolTokensLockup = 360; // 6 minutes
        firstEpochStartDate = Math.round(new Date().getTime() / 1000);
        votePauseSeconds = 60; // 1 minute
        epochLengthSeconds = 300; // 5 minutes
        initialGasLimit = 6700000;
        desiredEgl = 7300000;
        seedAccounts = [accounts[1], accounts[2]];
        eglsGifted = await giveFreeTokens(giftAccounts);
        creatorRewardAccount = accounts[9];
    }

    eglContract = await deployProxy(
        EglContract,
        [
            eglToken.address,
            routerAddress,
            ethToLaunchUniSwap,
            minPoolTokensLockup,
            firstEpochStartDate,
            votePauseSeconds,
            epochLengthSeconds,
            initialGasLimit,
            desiredEgl,
            seedAccounts,
            eglsGifted.toString(),
            creatorRewardAccount
        ],
        {deployer, unsafeAllowCustomTypes: true}
    );
    console.log("EGL Contract deployed to address: ", eglContract.address);

    // Transfer all tokens to EGL contract
    await eglToken.transfer(eglContract.address, totalEglSupply.sub(eglsGifted).toString());

    // Owns itself - and is the only one that can initiate upgrades
    await eglContract.transferOwnership(eglContract.address);
};
