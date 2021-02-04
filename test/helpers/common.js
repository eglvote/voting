const BN = require("bn.js");

async function giveFreeTokens(giftAccounts) {
    let giftEgls = new BN("0");
    for (let [name, address] of Object.entries(giftAccounts)) {
        await eglTokenInstance.transfer(address, web3.utils.toWei("50000000"));
        giftEgls = giftEgls.add(new BN(web3.utils.toWei("50000000")));
    }
    return giftEgls;
}

async function castSimpleVotes(...voteValues) {
    return await Promise.all(
        voteValues.map(async (voteValues) => {
            return await eglContractInstance.vote(
                voteValues[0],
                web3.utils.toWei(voteValues[1]),
                voteValues[2],
                ZERO_ADDRESS,
                0,
                ZERO_ADDRESS,
                { from: voteValues[3] }
            );
        })
    );
}

async function sleep(seconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    });
}

function populateEventDataFromLogs(txReceipt) {
    let contractEvents = {};
    txReceipt.logs.map((event) => {
        contractEvents[event.event] = event.args;
    });
    return contractEvents;
}

async function getBlockTimestamp(txReceipt) {
    let timestamp = (await web3.eth.getBlock(txReceipt.receipt.blockNumber))
        .timestamp;
    console.log("Block timestamp: ", timestamp);
    return timestamp;
}

module.exports = {
    BN,
    giveFreeTokens,
    castSimpleVotes,
    sleep,
    populateEventDataFromLogs,
    getBlockTimestamp,
}