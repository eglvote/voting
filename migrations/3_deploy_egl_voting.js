const { deployProxy, admin } = require("@openzeppelin/truffle-upgrades");
const { ConsoleColors } = require("../test/helpers/constants");
const { getBlockTimestamp } = require("../test/helpers/helper-functions");

const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");

const mockBalancerPoolTokenSupply = web3.utils.toWei("5693913.291241588098514244");

let eglGenesisAddress,
    balancerPoolTokenAddress,
    firstEpochStartDate,
    votePauseSeconds,
    epochLengthSeconds,
    seedAccounts,
    seedAmounts,
    creatorRewardAccount,
    mockBalancerPoolToken,
    eglOwner,
    eglTokenAddress;

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
        `Deploying ${ConsoleColors.MAGENTA} to ${ConsoleColors.MAGENTA} \n`, "EGL VOTING", network.toUpperCase()
    );

    if (network === "mainnet") {
        eglOwner = "0x85fc99FA14a708D5C60d78F53c794577fF97613B";
        eglTokenAddress = "0x1e83916Ea2EF2D7a6064775662E163b2D4C330a7" 
        eglGenesisAddress = "0x21Df223E4cc9F270383e33BCdDBc25F27cf7aE96";        
        balancerPoolTokenAddress = "0xb0401ab1108bd26c85a07243dfdf09f4821d76a2"; 
        firstEpochStartDate = 1628884800; // 13 August 4pm EST
        votePauseSeconds = 14400; // 4 hours
        epochLengthSeconds = 604800; // 1 week
        seedAccounts = [
            "0xf1df5c99e42a368229968f5aadfca0fab3aabf35",	// Alberto Cuesta Cañada
            "0x6394b37Cf80A7358b38068f0CA4760ad49983a1B",	// Alex Vlasov
            "0x77b1a6b645DeB2cF0B4216E6AB6e4CA95115Fb83",	// Andrea Lanfranchi 
            "0x9d6d3b09F8AC8615805bd82e53B80D956F451CFa",	// Artem Vorotnikov
            "0x03bbaFE60Bc8DBfF223d27541cE9F2bD494582c3",	// Boris Petrov
            "0xefef50ebacd8da3c13932ac204361b704eb8292c",	// Nicholas D’Andrea
            "0xde6BF0bf8AF48162a0dB3a51519092ddEd385fC0",	// Igor Mandrigin
            "0xC2A1db4CF8319E11E0851a912927Ec46c1c58B17",	// James Hancock
            "0xee8AE1F1B4B1E1956C8Bda27eeBCE54Cf0bb5eaB",	// James Prestwich
            "0x03f5bEf4f7131ab7535d341A4b08bcBBeae76Cf5",	// John Adler
            "0xBCa7f5e2fFa6977c38db52C429217d4dABbA5C59",	// Kaushik Donthi 
            "0xe158dcc1779fce4c48c8d3155ec35fae7c52d093",	// Matt Garnett
            "0xD095DDBC0BEa971A3ffcb5b64EEBAfce13B59538",	// Micah Zoltu
            "0xd046B3C521c0F5513C8A47eB3C2011684eA80B27",	// Philippe Castonguay
            "0x4fa38950e7cA220242113393fbEb68849ac454B6",	// Tim Roughgarden
            "0xF1fBf8A9E8819F81F638d591B7de4F0f4c1f0313",	// Alexey Sharp
            "0x11b31373f7b2D844BE186A105f4453f68fc512a0",	// Eugene Danilenko
            "0x86a65913224c0125635217AA848fF3Ebf1596EF0",	// Scott Bigelow
            "0x7ed27009E854590f3005B36A3e504c5877530A2D",	// Alex Sharov
            "0xe05875F287C028901798aC2Dc8C22Ba908b8eF36",	// Giulio Rebuffo             
        ];
        seedAmounts = [
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
            web3.utils.toWei("1500000"),
        ];
        creatorRewardAccount = "0x84e6aC061AA1419ac8c26BdCE587664b585cc83C";
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

        const eglToken = await EglToken.deployed();
        eglOwner = accounts[1]
        eglTokenAddress = eglToken.address
        eglGenesisAddress = "0x20A8EfD0cf9eeaEc0D435cc1A7b079Ad05d8e0D7"; // TODO: SET DEPLOYED GENESIS ADDRESS
        balancerPoolTokenAddress = mockBalancerPoolToken.address;
        // firstEpochStartDate = Math.round(new Date().getTime() / 1000);
        firstEpochStartDate = 1628619600;
        votePauseSeconds = 60; 
        epochLengthSeconds = 900;
        seedAccounts = [
            "0xd33004d667264373F4e090140993e2D471aa1763", // Eleni            
            "0xe2a5a680E6ec55bC5072EfAA79a74bb52c9EC65c", // Shane
        ];
        seedAmounts = [
            web3.utils.toWei("5000000"),
            web3.utils.toWei("5000000"),
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

        const eglToken = await EglToken.deployed();
        eglOwner = accounts[1];
        eglTokenAddress = eglToken.address
        eglGenesisAddress = mockEglGenesis.address;
        balancerPoolTokenAddress = mockBalancerPoolToken.address;
        firstEpochStartDate = await getBlockTimestamp(web3);
        votePauseSeconds = 1; // 10 seconds
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

    console.log(
        `Using EGL Token at address: ${ConsoleColors.CYAN}`, eglTokenAddress
    );

    let eglContract = await deployProxy(
        EglContract,
        [
            eglTokenAddress,
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
};
