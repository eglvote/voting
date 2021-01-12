const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");

module.exports = async function(done) {
    const accounts = await web3.eth.getAccounts();

    let token = await EglToken.deployed();
    console.log(web3.utils.fromWei((await token.totalSupply()).toString()));

    let eagle = await EglContract.deployed();
    console.log((await eagle.desiredEgl()).toString());

    token.transfer(eagle.address, web3.utils.toWei("3000000000"))
    console.log("Token balance for EGL Contract:", web3.utils.fromWei((await token.balanceOf(eagle.address)).toString()));

    token.transfer(accounts[1], web3.utils.toWei("1000"))
    console.log("Token balance for account 1:", web3.utils.fromWei((await token.balanceOf(accounts[1])).toString()));
    token.increaseAllowance(eagle.address, web3.utils.toWei("1000"), {from: accounts[1]})

    token.transfer(accounts[2], web3.utils.toWei("1000"))
    console.log("Token balance for account 2:", web3.utils.fromWei((await token.balanceOf(accounts[2])).toString()));
    token.increaseAllowance(eagle.address, web3.utils.toWei("1000"), {from: accounts[2]})

    token.transfer(accounts[3], web3.utils.toWei("1000"))
    console.log("Token balance for account 3:", web3.utils.fromWei((await token.balanceOf(accounts[3])).toString()));
    token.increaseAllowance(eagle.address, web3.utils.toWei("1000"), {from: accounts[3]})
    console.log(" ")

    eagle.vote(0, web3.utils.toWei("10"), 2, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000", {from: accounts[1]});
    eagle.vote(0, web3.utils.toWei("10"), 3, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000", {from: accounts[2]});
    eagle.vote(2, web3.utils.toWei("20"), 2, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000", {from: accounts[3]});

    console.log("Total rewards expected 90, Actual:", web3.utils.fromWei((await eagle.voterRewardSums(0)).toString()));
    console.log("Total rewards expected 90, Actual:", web3.utils.fromWei((await eagle.voterRewardSums(1)).toString()));
    console.log("Total rewards expected 30, Actual:", web3.utils.fromWei((await eagle.voterRewardSums(2)).toString()));
    console.log(" ")
    console.log("Votes up expected 50, Actual:", web3.utils.fromWei((await eagle.directionVoteCount(0, 0)).toString()));
    console.log("Votes up expected 50, Actual:", web3.utils.fromWei((await eagle.directionVoteCount(0, 1)).toString()));
    console.log("Votes up expected 30, Actual:", web3.utils.fromWei((await eagle.directionVoteCount(0, 2)).toString()));
    console.log(" ")
    console.log("Votes down expected 40, Actual:", web3.utils.fromWei((await eagle.directionVoteCount(2, 0)).toString()));
    console.log("Votes down expected 40, Actual:", web3.utils.fromWei((await eagle.directionVoteCount(2, 1)).toString()));
    console.log("Votes down expected 0, Actual:", web3.utils.fromWei((await eagle.directionVoteCount(2, 2)).toString()));
    // console.log("Votes down expected 150, Actual:", web3.utils.fromWei((await eagle.directionVoteCount(2, 1)).toString()));

    // let eagle = await EglContract.deployed();
    // eagle.tallyVotes();
    // eagle.reVote(0, web3.utils.toWei("100"), 8, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000", {from: accounts[5]}); // Should fail
    // eagle.reVote(0, web3.utils.toWei("5"), 2, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000", {from: accounts[2]});
    // (await eagle.voters(accounts[2]))[2].toString()

    // let eagle = await EglContract.deployed();
    // console.log((await eagle.desiredEgl()).toString());

    // call this to signal truffle that your script is done
    done();
}