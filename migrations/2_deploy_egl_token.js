const { deployProxy, admin } = require("@openzeppelin/truffle-upgrades");
const { ConsoleColors } = require("../test/helpers/constants");
const EglToken = artifacts.require("./EglToken.sol");

const totalEglSupply = web3.utils.toWei("4000000000"); // 4 billion
let genesisOwner, eglProxyAdmin;

module.exports = async function (deployer, network, accounts) {
    console.log(
        `Deploying to ${ConsoleColors.MAGENTA} \n`, network.toUpperCase()
    );    

    if (network === "mainnet") {
        throw "Confirm Contract Parameters";
        genesisOwner = "";
        eglProxyAdmin = "";
        }
    if (network === "ropsten") {
        genesisOwner = accounts[1];
        eglProxyAdmin = accounts[9];    
    }
    if (network === "kovan") {
        genesisOwner = accounts[1];
        eglProxyAdmin = accounts[9];    
    }
    if (network === "ganache") {
        genesisOwner = accounts[1];
        eglProxyAdmin = accounts[9];    
    }

    let eglToken = await deployProxy(
        EglToken,
        [genesisOwner, "EthereumGasLimit", "EGL", totalEglSupply.toString()],
        { deployer }
    );
    console.log(
        `EGL Token deployed to address: ${ConsoleColors.GREEN}`, eglToken.address
    );
    console.log(
        `Initial EGL token recipient: ${ConsoleColors.YELLOW}`, genesisOwner
    );
    let ownerEglBalance = web3.utils.fromWei(await eglToken.balanceOf(genesisOwner));
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

    admin.changeProxyAdmin(eglToken.address, eglProxyAdmin);
    console.log(
        `EGL Token admin set to account: ${ConsoleColors.YELLOW} \n`, eglProxyAdmin
    );
};
