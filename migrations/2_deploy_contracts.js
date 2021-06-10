const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { deployProxy, admin } = require("@openzeppelin/truffle-upgrades");
const {
  BN,
  ConsoleColors,
} = require("../test/helpers/constants");
const { airDropTokens } = require("../test/helpers/helper-functions");

const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");

module.exports = async function (deployer, network, accounts) {
  let totalEglSupply = new BN(web3.utils.toWei("4000000000")); // 4 billion
  let eglToken = await deployProxy(
    EglToken,
    ["Eagle", "EGL", totalEglSupply.toString()],
    { deployer }
  );
  console.log(
    `EGL Token deployed to address: ${ConsoleColors.GREEN}`,
    eglToken.address
  );

  // Default values are for mainnet
  let eglGenesisAddress = "";
  let balancerPoolTokenAddress = "";
  let firstEpochStartDate = Math.round(new Date().getTime() / 1000);
  let votePauseSeconds = 21600; // 6 hours
  let epochLengthSeconds = 604800; // 1 week
  let initialGasLimit = 12500000;
  let desiredEgl = 13000000;
  let seedAccounts = [];
  let seedAmounts = [];
  let eglsAirDropped = new BN("0"); // No air dropped tokens in mainnet
  let creatorRewardAccount = accounts[0];

  let mockBalancerPoolToken = "";
  let mockBalancerPoolTokenSupply = web3.utils.toWei("10000");

  if (network === "ropsten") {
    eglGenesisAddress = "";
    balancerPoolTokenAddress = "";

    airDropAccounts = {
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
    seedAmounts = [];
    eglsAirDropped = await airDropTokens(airDropAccounts, eglToken);
    creatorRewardAccount = accounts[0];
  }

  if (network === "ganache") {
    // Deploy Mock Genesis contract and make a contribution
    const MockEglGenesis = artifacts.require("./helpers/MockEglGenesis.sol");
    let eglGenesisContract = await deployer.deploy(MockEglGenesis);
    eglGenesisAddress = eglGenesisContract.address
    console.log(
      `EGL Genesis deployed to address: ${ConsoleColors.GREEN}`,
      eglGenesisAddress
    );
    await eglGenesisContract.sendTransaction({ from: accounts[9], value: web3.utils.toWei("0.01")});
    console.log(
      `Contributed 0.1ETH to Genesis from account: ${ConsoleColors.GREEN}`,
      accounts[9]
    );
    console.log("");
  
    // Deploy Balancer Pool Token
    const BalancerPoolToken = artifacts.require("./helpers/MockBalancerPoolToken.sol");
    mockBalancerPoolToken = await deployProxy(
      BalancerPoolToken, 
      ["Balancer Pool Token", "BPT", mockBalancerPoolTokenSupply],
      { from: deployer }
    );
    balancerPoolTokenAddress = mockBalancerPoolToken.address;
    console.log(
      `Balancer Pool Token deployed to address: ${ConsoleColors.GREEN}`,
      balancerPoolTokenAddress
    );
    console.log("");

    airDropAccounts = {
      "Account 3": accounts[3],
      "Account 4": accounts[4],
    };

    firstEpochStartDate = Math.round(new Date().getTime() / 1000);
    votePauseSeconds = 60; // 1 minute
    epochLengthSeconds = 300; // 5 minutes
    initialGasLimit = 6700000;
    desiredEgl = 7300000;
    seedAccounts = [accounts[1], accounts[2]];
    seedAmounts = [web3.utils.toWei("50000"), web3.utils.toWei("50000")];
    eglsAirDropped = await airDropTokens(airDropAccounts, eglToken);
    creatorRewardAccount = accounts[9];
  }

  let eglContract = await deployProxy(
    EglContract,
    [
      eglToken.address,
      balancerPoolTokenAddress,
      eglGenesisAddress,
      firstEpochStartDate,
      votePauseSeconds,
      epochLengthSeconds,
      initialGasLimit,
      desiredEgl,
      seedAccounts,
      seedAmounts,
      eglsAirDropped.toString(),
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
    `Total EGL's air dropped: ${ConsoleColors.CYAN}`,
    parseFloat(web3.utils.fromWei(eglsAirDropped.toString())).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 18,
      }
    )
  );
  console.log("");

  admin.changeProxyAdmin(eglContract.address, accounts[9]);
  console.log(
    `EGL Contract admin set to: ${ConsoleColors.GREEN}`,
    accounts[9]
  );
  console.log("");

  // Transfer all EGL tokens to EGL contract
  await eglToken.transfer(
    eglContract.address,
    totalEglSupply.sub(eglsAirDropped).toString()
  );
  
  if (network === "ganache") {
    // Transfer all BPT tokens to EGL contract
    await mockBalancerPoolToken.transfer(
      eglContract.address,
      mockBalancerPoolTokenSupply
    );
  }
};
