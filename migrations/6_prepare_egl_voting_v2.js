const { prepareUpgrade } = require("@openzeppelin/truffle-upgrades");
const { ConsoleColors } = require("../test/helpers/constants");
const EglContract = artifacts.require("./EglContract.sol");
const EglContractV2 = artifacts.require("./EglContractV2.sol");

module.exports = async function (deployer) {
    let eglContract = await EglContract.deployed()

    let eglContractV2Address = await prepareUpgrade(
        eglContract.address,
        EglContractV2,
        { deployer }
    );    
    
    console.log(
        `EGL Contract V2 deployed to address: : ${ConsoleColors.GREEN}`, eglContractV2Address        
    );
};
