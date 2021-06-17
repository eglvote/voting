const { deployProxy, admin } = require("@openzeppelin/truffle-upgrades");
const { ConsoleColors } = require("../test/helpers/constants");
const { getBlockTimestamp } = require("../test/helpers/helper-functions");

const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");

const mockBalancerPoolTokenSupply = web3.utils.toWei("10000");

let eglProxyAdmin,
    eglGenesisAddress,
    balancerPoolTokenAddress,
    firstEpochStartDate,
    votePauseSeconds,
    epochLengthSeconds,
    seedAccounts,
    seedAmounts,
    creatorRewardAccount,
    mockBalancerPoolToken;

module.exports = async function (deployer, network, accounts) {
    /**
     * accounts[0] - deployer
     * accounts[1] - genesisOwner
     * accounts[2] - seedAccount1
     * accounts[3] - seedAccount2
     * accounts[4] - 
     * accounts[5] - 
     * accounts[6] - 
     * accounts[7] - creatorRewards
     * accounts[8] - genesisSupporter
     * accounts[9] - proxyAdmin
     */ 

    console.log(
        `Deploying to ${ConsoleColors.MAGENTA} \n`, network.toUpperCase()
    );

    if (network === "mainnet") {
        throw "Confirm Contract Parameters"
        eglProxyAdmin = ""; // TODO: SET PROXY ADMIN
        eglGenesisAddress = ""; // TODO: SET DEPLOYED GENESIS ADDRESS
        balancerPoolTokenAddress = ""; // TODO: SET BPT ADDRESS
        firstEpochStartDate = Math.round(new Date().getTime() / 1000);
        votePauseSeconds = 21600; // 6 hours
        epochLengthSeconds = 604800; // 1 week
        seedAccounts = []; // TODO: SET SEED ACCOUNTS
        seedAmounts = []; // TODO: SET SEED AMOUNTS
        creatorRewardAccount = ""; // TODO: SET CREATOR REWARD ACCOUNT
    }

    if (network === "ropsten") {
        const MockBalancerPoolToken = artifacts.require("./helpers/MockBalancerPoolToken.sol");
        mockBalancerPoolToken = await deployProxy(
            MockBalancerPoolToken,
            ["Balancer Pool Token", "BPT", mockBalancerPoolTokenSupply],
            { from: deployer }
        );
        console.log(
            `Mock Balancer Pool Token deployed to address: ${ConsoleColors.GREEN}`, mockBalancerPoolToken.address
        );

        eglProxyAdmin = accounts[9]; // TODO: SET PROXY ADMIN
        eglGenesisAddress = mockEglGenesis.address; // TODO: SET DEPLOYED GENESIS ADDRESS
        balancerPoolTokenAddress = mockBalancerPoolToken.address; // TODO: SET BPT ADDRESS
        firstEpochStartDate = Math.round(new Date().getTime() / 1000);
        votePauseSeconds = 60; // 1 minute
        epochLengthSeconds = 300; // 5 minutes
        seedAccounts = [
            "0xd33004d667264373F4e090140993e2D471aa1763", // Eleni
        ];
        seedAmounts = [
            web3.utils.toWei("500000000"),
        ];
        creatorRewardAccount = "0x2755f888047Db8E3d169C6A427470C44b19a7270";
    }

    if (network === "ganache") {
        /**
         * Deploy mock versions of EGL Genesis and Balancer Pool Token for local only
         */
        const MockEglGenesis = artifacts.require("./helpers/MockEglGenesis.sol");
        await deployer.deploy(MockEglGenesis, accounts[1]);
        let mockEglGenesis = await MockEglGenesis.deployed();
        console.log(
            `Mock EGL Genesis deployed to address: ${ConsoleColors.GREEN}`, mockEglGenesis.address
        );
        await mockEglGenesis.sendTransaction({ from: accounts[8], value: web3.utils.toWei("0.01") });
        console.log(
            `Contributed 0.1ETH to Genesis from account: ${ConsoleColors.YELLOW}`, accounts[8]
        );

        const MockBalancerPoolToken = artifacts.require("./helpers/MockBalancerPoolToken.sol");
        mockBalancerPoolToken = await deployProxy(
            MockBalancerPoolToken,
            ["Balancer Pool Token", "BPT", mockBalancerPoolTokenSupply],
            { from: deployer }
        );
        console.log(
            `Mock Balancer Pool Token deployed to address: ${ConsoleColors.GREEN}`, mockBalancerPoolToken.address
        );
        /**
         * End deploy mock
         */

        eglProxyAdmin = accounts[9];
        eglGenesisAddress = mockEglGenesis.address;
        balancerPoolTokenAddress = mockBalancerPoolToken.address;
        firstEpochStartDate = await getBlockTimestamp(web3);
        votePauseSeconds = 10; // 10 seconds
        epochLengthSeconds = 60; // 1 minutes
        seedAccounts = [
            accounts[2],
            accounts[3]
        ];
        seedAmounts = [
            web3.utils.toWei("2500000"),
            web3.utils.toWei("2500000")
        ];
        creatorRewardAccount = accounts[7];
    }

    let eglToken = await EglToken.deployed();
    console.log(
        `EGL Contract deployed to address: ${ConsoleColors.GREEN}`, eglToken.address
    );

    let eglContract = await deployProxy(
        EglContract,
        [
            eglToken.address,
            balancerPoolTokenAddress,
            eglGenesisAddress,
            firstEpochStartDate,
            votePauseSeconds,
            epochLengthSeconds,
            seedAccounts,
            seedAmounts,
            creatorRewardAccount,
        ],
        { deployer }
    );
    console.log(
        `EGL Contract deployed to address: ${ConsoleColors.GREEN}`, eglContract.address
    );

    // Don't forget to transfer BPT tokens from MultiSig to EglContract

    admin.changeProxyAdmin(eglContract.address, eglProxyAdmin);
    console.log(
        `EGL Contract admin set to account: ${ConsoleColors.YELLOW}`, eglProxyAdmin
    );

    // Transfer all EGL tokens to EGL contract
    let remainingEglBalance = await eglToken.balanceOf(accounts[0])
    await eglToken.transfer(
        eglContract.address,
        remainingEglBalance.toString()
    );
    console.log(
        `Remaining EGL's transferred to account: ${ConsoleColors.YELLOW}`,
        parseFloat(web3.utils.fromWei(remainingEglBalance)).toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 18,
            }
        ),
        eglContract.address,
    );

    if (network === "ganache" || network === "ropsten") {
        // Transfer all mock BPT tokens to EGL contract
        await mockBalancerPoolToken.transfer(
            eglContract.address,
            mockBalancerPoolTokenSupply
        );
    }
};
