const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");

module.exports = async function(done) {
    const accounts = await web3.eth.getAccounts();

    let token = await EglToken.deployed();
    console.log((await token.totalSupply()).toString());

    let eagle = await EglContract.deployed();
    console.log((await eagle.desiredEgl()).toString());

    token.transfer(accounts[1], web3.utils.toWei("1000"))
    console.log("Token balance for account 1:", (await token.balanceOf(accounts[1])).toString());
    token.increaseAllowance(eagle.address, web3.utils.toWei("1000"), {from: accounts[1]})

    token.transfer(accounts[2], web3.utils.toWei("1000"))
    console.log("Token balance for account 2:", (await token.balanceOf(accounts[2])).toString());
    token.increaseAllowance(eagle.address, web3.utils.toWei("1000"), {from: accounts[2]})

    token.transfer(accounts[3], web3.utils.toWei("1000"))
    console.log("Token balance for account 3:", (await token.balanceOf(accounts[3])).toString());
    token.increaseAllowance(eagle.address, web3.utils.toWei("1000"), {from: accounts[3]})

    eagle.vote(0, web3.utils.toWei("100"), 8, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000", {from: accounts[1]});
    eagle.vote(0, web3.utils.toWei("50"), 4, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000", {from: accounts[2]});
    eagle.vote(2, web3.utils.toWei("75"), 2, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000", {from: accounts[3]});

    console.log("Expected 1150, Actual:", (await eagle.voterRewardSums(0)).toString());
    console.log("Expected 1150, Actual:", (await eagle.voterRewardSums(1)).toString());
    console.log("Expected 1000, Actual:", (await eagle.voterRewardSums(2)).toString());
    console.log("Expected 800, Actual:", (await eagle.voterRewardSums(4)).toString());
    console.log("Expected 0, Actual:", (await eagle.voterRewardSums(8)).toString());

    console.log("Expected 1000, Actual:", (await eagle.votesUp(0)).toString());
    console.log("Expected 1000, Actual:", (await eagle.votesUp(2)).toString());
    console.log("Expected 800, Actual:", (await eagle.votesUp(4)).toString());

    console.log("Expected 150, Actual:", (await eagle.votesDown(0)).toString());
    console.log("Expected 150, Actual:", (await eagle.votesDown(1)).toString());
    console.log("Expected 0, Actual:", (await eagle.votesDown(2)).toString());

    // eagle.tallyVotes();
    // eagle.revote(0, web3.utils.toWei("100"), 8, {from: accounts[5]}); // Should feil

    // let eagle = await EglContract.deployed();
    // console.log((await eagle.desiredEgl()).toString());

    // call this to signal truffle that your script is done
    done();
}