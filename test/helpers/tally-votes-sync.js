const EglContract = artifacts.require("./EglContract.sol");

module.exports = async function (callback) {
    // let eglContract = await EglContract.at("0x466bdA629bB5df9D4ca5d72C5bFF4B160d8E992C");
    let eglContract = await EglContract.deployed();
    while (true) {
        try {
            let txReceipt = await eglContract.tallyVotes();
            console.log("TxReceipt: ", txReceipt.tx);
            console.log("Current Epoch: ", (await eglContract.currentEpoch()).toString());
        } catch (error) {
            if (error.toString().includes("EGL:VOTE_NOT_ENDED"))
                console.log("Tally Votes up to date");
            else
                console.log("Error: ", error)
            callback();
        }
    }
}