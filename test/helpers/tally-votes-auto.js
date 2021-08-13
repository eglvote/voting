const { sleep } = require("./helper-functions");

const EglContract = artifacts.require("./EglContract.sol");

module.exports = async function (callback) {
    console.log("Starting auto tally votes, sleeping for 10 seconds...")
    await sleep(10);   
    try {
        let eglContract = await EglContract.at("0x466bdA629bB5df9D4ca5d72C5bFF4B160d8E992C");
        console.log("Current Epoch: ", (await eglContract.currentEpoch()).toString());    
        let txReceipt = await eglContract.tallyVotes();
        console.log("TxReceipt: ", txReceipt.tx);
    } catch (error) {
        if (error.toString().includes("EGL:VOTE_NOT_ENDED"))
            console.log("Vote hasn't ended...");
        else
            console.log("Vote probably hasn't ended: ", error.name)
    }    
    callback();
}