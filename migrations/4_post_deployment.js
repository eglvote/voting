const { ConsoleColors } = require("../test/helpers/constants");

const EglContract = artifacts.require("./EglContract.sol");
const EglToken = artifacts.require("./EglToken.sol");

const mockBalancerPoolTokenSupply = web3.utils.toWei("5693913.291241588098514244");

let eglOwner;

module.exports = async function (deployer, network, accounts) {
    console.log(
        `Running ${ConsoleColors.MAGENTA} steps for ${ConsoleColors.MAGENTA} \n`, "POST DEPLOYMENT", network.toUpperCase()
    );

    if (network !== "mainnet") {
        eglOwner = accounts[1];

        let eglContract = await EglContract.deployed();
        console.log(
            `Using EGL Voting Contract at address: ${ConsoleColors.CYAN}`, eglContract.address
        );

        let eglToken = await EglToken.deployed();
        console.log(
            `Using EGL Token at address: ${ConsoleColors.CYAN}`, eglToken.address
        );

        const MockBalancerPoolToken = artifacts.require("./helpers/MockBalancerPoolToken.sol");
        let mockBalancerPoolToken = await MockBalancerPoolToken.deployed();
        console.log(
            `Using Balancer Pool Token at address: ${ConsoleColors.CYAN}`, mockBalancerPoolToken.address
        );

        // Transfer all EGL tokens to EGL contract
        await eglToken.transfer(
            eglContract.address,
            web3.utils.toWei("3250000000"),
            { from: eglOwner }
        );

        let eglContractBalance = await eglToken.balanceOf(eglContract.address)
        console.log(
            `EGL Voting Contract token balance after transfer: ${ConsoleColors.GREEN}`,
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
            `Owner EGL token balance after transfer: ${ConsoleColors.GREEN}`,
            parseFloat(web3.utils.fromWei(genesisOwnerBalance)).toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 18,
                }
            )     
        );
        // Transfer all mock BPT tokens to EGL contract
        await mockBalancerPoolToken.transfer(
            eglContract.address,
            mockBalancerPoolTokenSupply,
            { from: eglOwner }
        );

        let contractBptBalance = await mockBalancerPoolToken.balanceOf(eglContract.address)
        console.log(
            `EGL Voting Contract BPT balance after transfer: ${ConsoleColors.GREEN}`,
            parseFloat(web3.utils.fromWei(contractBptBalance)).toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 18,
                }
            )     
        );
    } else {
        console.log("Remaining post deployment tasks that need to be completed manually from the multisig:")
        console.log(`${ConsoleColors.CYAN}`, "\t1. Transfer all EGL's from multisig wallet to voting contract")
        console.log(`${ConsoleColors.CYAN}`, "\t2. Transfer all BPT's from multisig wallet to voting contract")
    }
};
