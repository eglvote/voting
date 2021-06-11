const { deployProxy, admin } = require("@openzeppelin/truffle-upgrades");
const { BN, ConsoleColors } = require("../test/helpers/constants");
const { airDropTokens, getBlockTimestamp } = require("../test/helpers/helper-functions");

const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");

const mockBalancerPoolTokenSupply = web3.utils.toWei("10000");

let eglProxyAdmin, 
eglGenesisAddress, 
balancerPoolTokenAddress,
firstEpochStartDate,
votePauseSeconds,
epochLengthSeconds,
initialGasLimit,
desiredEgl,
seedAccounts,
seedAmounts,
eglsAirDropped,
creatorRewardAccount,
mockBalancerPoolToken;

module.exports = async function (deployer, network, accounts) {
  /**   
   * PRE-CONDITIONS
   * --------------
   * - EGL Genesis deployed previously
   *    - owned by multi-sig
   *    - proxyAdmin is different multisig
   *    - funds transferred to multi-sig after genesis end
   * - Balancer deployed by multisig
   *    - BPT for pool creation assigned to multi-sig
   * 
   * EGL VOTING
   * ----------
   * - Deploy EGL Token
   * - Initialize Voting contract with
   *    - EGL token address
   *    - BPT address 
   *    - Genesis address
   * - Change ProxyAdmin to "upgrader" multisig
   * - Transfer all EGL tokens owned by deployer to Voting contract
   * - Transfer all BPT tokens owned by multisig to Voting contract - Manual step after deploy in prod
   */
  console.log(
    `Deploying to ${ConsoleColors.MAGENTA} \n`,
    network.toUpperCase()
  );

  let totalEglSupply = new BN(web3.utils.toWei("4000000000")); // 4 billion
  let eglToken = await deployProxy(
    EglToken,
    ["EthereumGasLimit", "EGL", totalEglSupply.toString()],
    { deployer }
  );
  console.log(
    `EGL Token deployed to address: ${ConsoleColors.GREEN}`,
    eglToken.address
  );

  if (network === "mainnet") {
    throw "Confirm Contract Parameters"
    eglProxyAdmin = ""; // TODO: SET PROXY ADMIN
    eglGenesisAddress = ""; // TODO: SET DEPLOYED GENESIS ADDRESS
    balancerPoolTokenAddress = ""; // TODO: SET BPT ADDRESS
    firstEpochStartDate = Math.round(new Date().getTime() / 1000);
    votePauseSeconds = 21600; // 6 hours
    epochLengthSeconds = 604800; // 1 week
    initialGasLimit = 12500000; // 12.5 million
    desiredEgl = 13000000; // 13 million
    seedAccounts = []; // TODO: SET SEED ACCOUNTS
    seedAmounts = []; // TODO: SET SEED AMOUNTS
    eglsAirDropped = new BN("0"); // No air dropped tokens in mainnet
    creatorRewardAccount = ""; // TODO: SET CREATOR REWARD ACCOUNT
  }

  let mockBalancerPoolToken = "";
  let mockBalancerPoolTokenSupply = web3.utils.toWei("10000");

  if (network === "ropsten") {
    const MockBalancerPoolToken = artifacts.require("./helpers/MockBalancerPoolToken.sol");
    mockBalancerPoolToken = await deployProxy(
      MockBalancerPoolToken, 
      ["Balancer Pool Token", "BPT", mockBalancerPoolTokenSupply],
      { from: deployer }
    );    
    console.log(
      `Mock Balancer Pool Token deployed to address: ${ConsoleColors.GREEN}`,
      mockBalancerPoolToken.address
    );

    airDropAccounts = {
      // Shane: "0x2755f888047Db8E3d169C6A427470C44b19a7270",
      // "Uri": "0xb079b14b218013C81Fe17Cb0D4B665E448722dc5",
      // "Aleks": "0xC8dbcEFD80aA21f0Edb1B4F2cF16F26022620382",
      // "Aleks2": "0xe6F20c676966D632E3DA373763e02F0BdB5D441f",
      // Eleni: "0xB04Ad04A2ac41dBbe8be06EE8938318575bb5E4b",
      // "Eyal": "0x2C596F42d15848b6dD997B255B9c033Ce7240644",
      // Greg: "0x8E85bD36Cce941b76D1c668B282D842f867e6F0d",
      // Greg0: "0xca78c111cf45fe0b8d4f3918632ddc33917af882",
      // Greg1: "0x4BbeC2dd6E9AA092D2588e4c9c948ADC0367F966",
    };

    eglProxyAdmin = accounts[9]; // TODO: SET PROXY ADMIN
    eglGenesisAddress = "0x51712ac5c27187F115b4A0eF4cF8d2b8989fB470"; // TODO: SET DEPLOYED GENESIS ADDRESS
    balancerPoolTokenAddress = mockBalancerPoolToken.address; // TODO: SET BPT ADDRESS
    firstEpochStartDate = Math.round(new Date().getTime() / 1000);
    votePauseSeconds = 60; // 1 minute
    epochLengthSeconds = 300; // 5 minutes
    initialGasLimit = 8000000;
    desiredEgl = 8500000;
    seedAccounts = [
      "0xd33004d667264373F4e090140993e2D471aa1763", // Eleni
      // "0x0E339E8eBc4c1FaAdE9bd2abDff0AF20759101B8", // Uri
      // "0x6580F6D5ab79a97C2c9Cc695643E2433502Fa619", // Uri
      // "0x4eC182E9a1eE64d2FE83F4Bb01FC3aA59Cabc1A4", // Uri
      // "0x9ecE358eF86B898dc057E8405F58Df9c747DBb72", // Uri
      // "0x45F2737fd67e32e3f26DdDb765855cfB10d570C0", // Uri
    ];
    seedAmounts = [
      web3.utils.toWei("500000000"), 
      // web3.utils.toWei("50000"), 
      // web3.utils.toWei("50000"),
      // web3.utils.toWei("50000"), 
      // web3.utils.toWei("50000"),
      // web3.utils.toWei("50000"),
    ];
    eglsAirDropped = await airDropTokens(airDropAccounts, eglToken);
    creatorRewardAccount = "0xAc9FB52D1163c6D9da21B981846910d3c331d86e";
  }

  if (network === "ganache") {
    /**
     * Deploy mock versions of EGL Genesis and Balancer Pool Token for local only
     */
    const MockEglGenesis = artifacts.require("./helpers/MockEglGenesis.sol");
    let mockEglGenesis = await deployer.deploy(MockEglGenesis);
    console.log(
      `Mock EGL Genesis deployed to address: ${ConsoleColors.GREEN}`,
      mockEglGenesis.address
    );
    await mockEglGenesis.sendTransaction({ from: accounts[8], value: web3.utils.toWei("0.01")});
  
    const MockBalancerPoolToken = artifacts.require("./helpers/MockBalancerPoolToken.sol");
    mockBalancerPoolToken = await deployProxy(
      MockBalancerPoolToken, 
      ["Balancer Pool Token", "BPT", mockBalancerPoolTokenSupply],
      { from: deployer }
    );    
    console.log(
      `Mock Balancer Pool Token deployed to address: ${ConsoleColors.GREEN}`,
      mockBalancerPoolToken.address
    );
    console.log(
      `   Contributed 0.1ETH to Genesis from account: ${ConsoleColors.YELLOW}`,
      accounts[9]
    );
    /**
     * End deploy mock
     */

    airDropAccounts = {
      "Account 3": accounts[3],
      "Account 4": accounts[4],
    };

    eglProxyAdmin = accounts[9];
    eglGenesisAddress = mockEglGenesis.address;
    balancerPoolTokenAddress = mockBalancerPoolToken.address;
    firstEpochStartDate = await getBlockTimestamp(web3);
    votePauseSeconds = 10; // 1 minute
    epochLengthSeconds = 60; // 5 minutes
    initialGasLimit = 6700000;
    desiredEgl = 7300000;
    seedAccounts = [
      accounts[1], 
      accounts[2]
    ];
    seedAmounts = [
      web3.utils.toWei("2500000"), 
      web3.utils.toWei("2500000")
    ];
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

  // Don't forget to transfer BPT tokens from MultiSig to EglContract

  admin.changeProxyAdmin(eglContract.address, eglProxyAdmin);
  console.log(
    `   EGL Contract admin set to account: ${ConsoleColors.YELLOW}`,
    eglProxyAdmin
  );

  console.log(
    `   Total EGL's air dropped: ${ConsoleColors.CYAN}`,
    parseFloat(web3.utils.fromWei(eglsAirDropped.toString())).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 18,
      }
    )
  );

  // Transfer all EGL tokens to EGL contract
  await eglToken.transfer(
    eglContract.address,
    totalEglSupply.sub(eglsAirDropped).toString()    
  );
  
  if (network === "ganache" || network === "ropsten") {
    // Transfer all BPT tokens to EGL contract
    await mockBalancerPoolToken.transfer(
      eglContract.address,
      mockBalancerPoolTokenSupply
    );
  }
};
