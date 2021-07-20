const { deployProxy, admin } = require("@openzeppelin/truffle-upgrades");
const { ConsoleColors } = require("../test/helpers/constants");
const { getBlockTimestamp } = require("../test/helpers/helper-functions");

const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");

const mockBalancerPoolTokenSupply = web3.utils.toWei("75000000");

let eglProxyAdmin,
    eglGenesisAddress,
    balancerPoolTokenAddress,
    firstEpochStartDate,
    votePauseSeconds,
    epochLengthSeconds,
    seedAccounts,
    seedAmounts,
    creatorRewardAccount,
    mockBalancerPoolToken,
    eglOwner;

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
        eglOwner = ""; // TODO: SET OWNER ADDRESS
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
        await mockBalancerPoolToken.transfer(
            accounts[1],
            mockBalancerPoolTokenSupply
        );
        console.log(
            `Mock Balancer Pool Token transferred to Genesis owner address: ${ConsoleColors.YELLOW}\n`, accounts[1]
        );

        eglOwner = accounts[1]
        eglProxyAdmin = accounts[9]; // TODO: SET PROXY ADMIN
        eglGenesisAddress = "0xf58399948E9636959Cb6bCD2Ec9eE651848c581f"; // TODO: SET DEPLOYED GENESIS ADDRESS
        balancerPoolTokenAddress = mockBalancerPoolToken.address; // TODO: SET BPT ADDRESS
        firstEpochStartDate = Math.round(new Date().getTime() / 1000);
        votePauseSeconds = 600; // 10 minutes
        epochLengthSeconds = 10800; // 3 hours
        seedAccounts = [
            // "0xd33004d667264373F4e090140993e2D471aa1763", // Eleni            
            // "0xe2a5a680E6ec55bC5072EfAA79a74bb52c9EC65c", // Shane
        ];
        seedAmounts = [
            // web3.utils.toWei("5000000"),
            // web3.utils.toWei("5000000"),
        ];
        creatorRewardAccount = "0xA40b6610677CBD4A9560C00234D86a8C2B1A17CC";
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
            `Contributed 0.1 ETH to Genesis from account: ${ConsoleColors.YELLOW}`, accounts[8]
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
        await mockBalancerPoolToken.transfer(
            accounts[1],
            mockBalancerPoolTokenSupply
        );
        console.log(
            `Mock Balancer Pool Token transferred to address: ${ConsoleColors.YELLOW}\n`, accounts[1]
        );
        /**
         * End deploy mock
         */

        eglOwner = accounts[1];
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
        `Using EGL Token at address: ${ConsoleColors.CYAN}`, eglToken.address
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

    // Transfer ownership to eglOwner
    await eglContract.transferOwnership(eglOwner)
    console.log(
        `EGL Contract ownership transferred to account: ${ConsoleColors.YELLOW}`, eglOwner
    );

    admin.changeProxyAdmin(eglContract.address, eglProxyAdmin);
    console.log(
        `EGL Contract admin set to account: ${ConsoleColors.YELLOW}\n`, eglProxyAdmin
    );

    // TODO: Multisig wallet
    // Transfer all EGL tokens to EGL contract
    await eglToken.transfer(
        eglContract.address,
        web3.utils.toWei("3250000000"),
        { from: eglOwner }
    );

    let eglContractBalance = await eglToken.balanceOf(eglContract.address)
    console.log(
        `EGL Contract EGL token balance: ${ConsoleColors.GREEN}`,
        parseFloat(web3.utils.fromWei(eglContractBalance)).toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 18,
            }
        )     
    );

    let genesisOwnerBalance = await eglToken.balanceOf(eglOwner)
    console.log(
        `EGL owner token balance: ${ConsoleColors.GREEN}`,
        parseFloat(web3.utils.fromWei(genesisOwnerBalance)).toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 18,
            }
        )     
    );

    if (network === "ganache" || network === "ropsten") {
        // Transfer all mock BPT tokens to EGL contract
        await mockBalancerPoolToken.transfer(
            eglContract.address,
            mockBalancerPoolTokenSupply,
            { from: eglOwner }
        );

        let contractBptBalance = await mockBalancerPoolToken.balanceOf(eglContract.address)
        console.log(
            `EGL Contract BPT token balance: ${ConsoleColors.GREEN}`,
            parseFloat(web3.utils.fromWei(contractBptBalance)).toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 18,
                }
            )     
        );
    }
};
