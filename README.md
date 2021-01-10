## Setup
1. `npm install`
1. `truffle compile` to compile contracts
1. `truffle migrate` to deploy contracts to default network defined in truffle-config.js
1. `truffle migrate --network <NAME>>` to deploy to specific network in truffle-config.js
1. `truffle console --network <NAME>` to access console and interact with contracts

## Interacting with contracts from console
```js
eagle = await EglContract.deployed();
(await eagle.votesUp(1)).toString();
await eagle.testFunction(0, 3, 100);


(await web3.eth.getBlock("latest")).number
const accounts = await web3.eth.getAccounts()

token = await EglToken.deployed()
eagle = await EglContract.deployed()

token.increaseAllowance(eagle.address, "10000000000000000000000")

(await token.balanceOf(accounts[1])).toString()
token.transfer(accounts[1], web3.utils.toWei("1000"))
token.increaseAllowance(eagle.address, web3.utils.toWei("1000"), {from: accounts[1]})

(await token.balanceOf(accounts[5])).toString()
token.transfer(accounts[5], web3.utils.toWei("1000"))
(await token.balanceOf(accounts[5])).toString()
token.increaseAllowance(eagle.address, web3.utils.toWei("1000"), {from: accounts[5]})

// Add tokens and increase allowance other accounts
token.transfer(accounts[2], web3.utils.toWei("1000"))
token.transfer(accounts[3], web3.utils.toWei("1000"))
token.increaseAllowance(eagle.address, web3.utils.toWei("1000"), {from: accounts[2]})
token.increaseAllowance(eagle.address, web3.utils.toWei("1000"), {from: accounts[3]})


(await token.supplyLimit()).toString()
(await token.totalSupply()).toString()

(await token.balanceOf(accounts[5])).toString()
(await token.balanceOf(eagle.address)).toString()
```

## Testing setup
```js
// Deploy contracts (truffle migrate)
// In truffle console, run `exec bootstrap-data.js`
const accounts = await web3.eth.getAccounts();
const token = await EglToken.deployed();
const eagle = await EglContract.deployed();

eagle.tallyVotes();
eagle.vote(2, web3.utils.toWei("100"), 2, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000", {from: accounts[3]});
eagle.reVote(0, web3.utils.toWei("100"), 2, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000", {from: accounts[1]});
```