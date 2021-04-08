const { deployProxy, admin } = require("@openzeppelin/truffle-upgrades");
const {
  BN,
  WethToken,
  UniswapV2Factory,
  UniswapV2Router,
  ConsoleColors,
} = require("../test/helpers/constants");
const { giveFreeTokens } = require("../test/helpers/helper-functions");

const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");
const EglUpgrader = artifacts.require("./EglUpgrader.sol");

module.exports = async function (deployer, network, accounts) {
  let totalEglSupply = new BN(web3.utils.toWei("4000000000")); // 4 billion
  let eglToken = await deployProxy(
    EglToken,
    ["TestToken", "TTK", totalEglSupply.toString()],
    { deployer }
  );
  console.log(
    `EGL Token deployed to address: ${ConsoleColors.GREEN}`,
    eglToken.address
  );

  // Default values are for mainnet
  let routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap Router
  let ethToLaunchUniSwap = web3.utils.toWei("1000");
  let firstEpochStartDate = Math.round(new Date().getTime() / 1000);
  let votePauseSeconds = 21600; // 6 hours
  let epochLengthSeconds = 604800; // 1 week
  let initialGasLimit = 12500000;
  let desiredEgl = 13000000;
  let seedAccounts = [];
  let eglsGifted = new BN("0"); // No gift tokens in mainnet
  let creatorRewardAccount = accounts[0];

  if (network === "ropsten") {
    giftAccounts = {
      Shane: "0x2755f888047Db8E3d169C6A427470C44b19a7270",
      // "Uri": "0xb079b14b218013C81Fe17Cb0D4B665E448722dc5",
      // "Aleks": "0xC8dbcEFD80aA21f0Edb1B4F2cF16F26022620382",
      // "Aleks2": "0xe6F20c676966D632E3DA373763e02F0BdB5D441f",
      Eleni: "0xB04Ad04A2ac41dBbe8be06EE8938318575bb5E4b",
      // "Eyal": "0x2C596F42d15848b6dD997B255B9c033Ce7240644",
      Greg: "0x8E85bD36Cce941b76D1c668B282D842f867e6F0d",
      Greg0: "0xca78c111cf45fe0b8d4f3918632ddc33917af882",
      Greg1: "0x4BbeC2dd6E9AA092D2588e4c9c948ADC0367F966",
    };

    ethToLaunchUniSwap = web3.utils.toWei("10");
    firstEpochStartDate = Math.round(new Date().getTime() / 1000);
    votePauseSeconds = 60; // 1 minute
    epochLengthSeconds = 600; // 10 minutes
    initialGasLimit = 8000000;
    desiredEgl = 8500000;
    seedAccounts = [
      // "0x0E339E8eBc4c1FaAdE9bd2abDff0AF20759101B8", // Uri
      // "0x6580F6D5ab79a97C2c9Cc695643E2433502Fa619", // Uri
      // "0x4eC182E9a1eE64d2FE83F4Bb01FC3aA59Cabc1A4", // Uri
      // "0x9ecE358eF86B898dc057E8405F58Df9c747DBb72", // Uri
      // "0x45F2737fd67e32e3f26DdDb765855cfB10d570C0", // Uri
    ];
    eglsGifted = await giveFreeTokens(giftAccounts, eglToken);
    creatorRewardAccount = accounts[0];
  }

  if (network === "ganache") {
    let wethToken = await WethToken.new();

    UniswapV2Factory.setProvider(web3._provider);
    await deployer.deploy(UniswapV2Factory, accounts[0], { from: accounts[0] });
    let factoryContract = await UniswapV2Factory.deployed();
    console.log(
      `UniSwap Factory deployed to address: ${ConsoleColors.GREEN}`,
      factoryContract.address
    );

    UniswapV2Router.setProvider(web3._provider);
    await deployer.deploy(
      UniswapV2Router,
      factoryContract.address,
      wethToken.address,
      { from: accounts[0] }
    );
    let routerContract = await UniswapV2Router.deployed();
    console.log(
      `UniSwap Router deployed to address: ${ConsoleColors.GREEN}`,
      routerContract.address
    );

    giftAccounts = {
      "Account 3": accounts[3],
      "Account 4": accounts[4],
    };

    routerAddress = routerContract.address;
    ethToLaunchUniSwap = web3.utils.toWei("1");
    firstEpochStartDate = Math.round(new Date().getTime() / 1000);
    votePauseSeconds = 60; // 1 minute
    epochLengthSeconds = 300; // 5 minutes
    initialGasLimit = 6700000;
    desiredEgl = 7300000;
    seedAccounts = [accounts[1], accounts[2]];
    eglsGifted = await giveFreeTokens(giftAccounts, eglToken);
    creatorRewardAccount = accounts[9];
  }

  let eglUpgrader = await deployer.deploy(EglUpgrader);
  console.log(
    `EGL Upgrader deployed to address: ${ConsoleColors.GREEN}`,
    eglUpgrader.address
  );

  let eglContract = await deployProxy(
    EglContract,
    [
      eglUpgrader.address,
      eglToken.address,
      routerAddress,
      ethToLaunchUniSwap,
      firstEpochStartDate,
      votePauseSeconds,
      epochLengthSeconds,
      initialGasLimit,
      desiredEgl,
      seedAccounts,
      eglsGifted.toString(),
      creatorRewardAccount,
    ],
    { deployer }
  );
  console.log(
    `EGL Contract deployed to address: ${ConsoleColors.GREEN}`,
    eglContract.address
  );
  console.log("");
  console.log(
    `Total EGL's gifted: ${ConsoleColors.CYAN}`,
    parseFloat(web3.utils.fromWei(eglsGifted.toString())).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 18,
      }
    )
  );
  console.log("");

  await eglUpgrader.setOwner(eglContract.address);
  console.log(
    `Owner of EGL Upgrader set to EGL Contract: ${ConsoleColors.GREEN}`,
    eglContract.address
  );
  console.log("");

  admin.changeProxyAdmin(eglContract.address, eglUpgrader.address);
  console.log(
    `EGL Contract admin set to EGL Uploader: ${ConsoleColors.GREEN}`,
    eglUpgrader.address
  );
  console.log("");

  // Bootstrap the contract with 1000 wei which is the minimum liquidity for UniSwap
  web3.eth.sendTransaction({
    from: accounts[0],
    to: eglContract.address,
    value: 1000,
  });

  // Transfer all tokens to EGL contract
  await eglToken.transfer(
    eglContract.address,
    totalEglSupply.sub(eglsGifted).toString()
  );
};
