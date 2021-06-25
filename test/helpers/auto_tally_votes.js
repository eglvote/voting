const { sleep } = require("./helper-functions");

const EglContract = artifacts.require("./EglContract.sol");

module.exports = async function(callback) {
    // let eglContract = await EglContract.at("0xEbc912Ff269221d158FE20f64A731fF56fFa9Ff0");
    let eglContract = await EglContract.deployed();
    console.log("Starting Epoch: ", (await eglContract.currentEpoch()).toString());
    let sleepTime = 600
    while (true) {      
        try {            
            let txReceipt = await eglContract.tallyVotes();
            console.log("TxReceipt: ", txReceipt.tx);
            console.log("Current Epoch: ", (await eglContract.currentEpoch()).toString());
            await sleep(sleepTime);        
        } catch(error) {
            sleepTime++;
            if (error.toString().includes("EGL:VOTE_NOT_ENDED"))
                console.log("Vote not ended, waiting " + sleepTime + " seconds next iteration");
            else
                console.log("Error: ", error.toString())
        }
    }
    
}