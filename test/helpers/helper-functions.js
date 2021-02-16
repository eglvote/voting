const { BN } = require("bn.js");

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

function populateAllEventDataFromLogs(txReceipt, eventName) {
    let contractEvents = [];
    txReceipt.logs.map((event) => {
        if (event.event === eventName)
            contractEvents.push(event.args);        
    });
    return contractEvents;
}

async function getAllEventsForType(eventName, eglContract) {
    let events = await eglContract.getPastEvents(eventName, {
        fromBlock: 0,
        toBlock: 'latest',
    });

    let parsedEvents = []
    events.map((event) => {
        parsedEvents.push(event.args);
    });
    return parsedEvents;
}

async function getBlockTimestamp(web3, txReceipt) {
    return (await web3.eth.getBlock(txReceipt.receipt.blockNumber)).timestamp;
}

async function getBlockGasLimit(web3, txReceipt) {
    return  (await web3.eth.getBlock(txReceipt.receipt.blockNumber)).gasLimit
}

function getNewWalletAddress(web3) {
    return web3.eth.accounts.create()
}

async function giveFreeTokens(giftAccounts, eglToken) {
    let giftEgls = new BN("0");
    for (let [, address] of Object.entries(giftAccounts)) {
        await eglToken.transfer(address, "50000000000000000000000000");
        giftEgls = giftEgls.add(new BN("50000000000000000000000000"));
    }
    return giftEgls;
}

module.exports = {
    sleep,
    populateEventDataFromLogs,
    populateAllEventDataFromLogs,
    getBlockTimestamp,
    giveFreeTokens,
    getAllEventsForType,
    getBlockGasLimit,
    getNewWalletAddress
}
