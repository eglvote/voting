const EglContract = artifacts.require("./EglContract.sol");

module.exports = async function(callback) {
    let eglContract = await EglContract.at("0xc71d2b110659499D6bE9F3714747Ea4F816403ae");
    console.log("Current Epoch: ", (await eglContract.currentEpoch()).toString());    
    let txReceipt = await eglContract.tallyVotes();
    console.log("TxReceipt: ", txReceipt.tx);
    callback();
}