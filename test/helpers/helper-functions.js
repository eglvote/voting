const { BN } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

async function sleep(seconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    });
}

function populateEventDataFromLogs(txReceipt, eventName) {
    let contractEvents = {};
    txReceipt.logs.map((event) => {
        contractEvents[event.event] = event.args;
    });
    return contractEvents[eventName];
}

async function getBlockTimestamp(txReceipt) {
    return (await web3.eth.getBlock(txReceipt.receipt.blockNumber)).timestamp;
}

async function giveFreeTokens(giftAccounts, eglToken) {
    let giftEgls = new BN("0");
    for (let [name, address] of Object.entries(giftAccounts)) {
        await eglToken.transfer(address, web3.utils.toWei("50000000"));
        giftEgls = giftEgls.add(new BN(web3.utils.toWei("50000000")));
    }
    return giftEgls;
}

module.exports = {
    sleep,
    populateEventDataFromLogs,
    getBlockTimestamp,
    giveFreeTokens,
}