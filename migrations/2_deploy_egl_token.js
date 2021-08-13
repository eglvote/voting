const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const { ConsoleColors } = require("../test/helpers/constants");
const EglToken = artifacts.require("./EglToken.sol");

const totalEglSupply = web3.utils.toWei("4000000000"); // 4 billion
let tokenRecipient;

module.exports = async function (deployer, network, accounts) {
    console.log(
        `Deploying ${ConsoleColors.MAGENTA} to ${ConsoleColors.MAGENTA} \n`, "EGL TOKEN", network.toUpperCase()
    );    

    if (network === "mainnet") {
        tokenRecipient = "0x72E995cb1148b6BF4C27484824AB5D08B2b6Ca7d";
    }
    if (network === "ropsten") {
        tokenRecipient = accounts[1];
    }
    if (network === "kovan") {
        tokenRecipient = accounts[1];
    }
    if (network === "rinkeby") {
        tokenRecipient = "0x85f75AC5f1beFbdC6954Ed9D77b75b74469fB554";
    }
    if (network === "ganache") {
        tokenRecipient = accounts[1];
    }

    let eglToken = await deployProxy(
        EglToken,
        [tokenRecipient, "EthereumGasLimit", "EGL", totalEglSupply.toString()],
        { deployer }
    );
    console.log(
        `EGL Token deployed to address: ${ConsoleColors.GREEN}`, eglToken.address
    );
    console.log(
        `Initial EGL token recipient: ${ConsoleColors.YELLOW}`, tokenRecipient
    );
    let ownerEglBalance = web3.utils.fromWei(await eglToken.balanceOf(tokenRecipient));
    console.log(
        `EGL balance of initial token recipient: ${ConsoleColors.YELLOW} \n`, 
        parseFloat(ownerEglBalance).toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 18,
            }
        )        
    );
};
