const { admin } = require("@openzeppelin/truffle-upgrades");
const { ConsoleColors } = require("../test/helpers/constants");

module.exports = async function (deployer, network, accounts) {
    console.log(
        `Running ${ConsoleColors.MAGENTA} steps for ${ConsoleColors.MAGENTA} \n`, "TRANSFER PROXY ADMIN OWNERSHIP", network.toUpperCase()
    );

    let newProxyAdmin = ""
    if (network === "mainnet") {
        newProxyAdmin = "0xe01Af1f67022439d267104A87343592c9429f3Bc"
    } else {
        newProxyAdmin = accounts[9]
    }

    try {
        await admin.transferProxyAdminOwnership(newProxyAdmin);
        console.log(
            `EGL Proxy Admin set to: ${ConsoleColors.YELLOW}`,
            newProxyAdmin
        );    
    } catch {
        console.log(`Unable to transfer ownership of ProxyAdmin, this has probably already been transferred to: ${ConsoleColors.YELLOW}`, newProxyAdmin)
    }
};
