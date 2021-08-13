![EGL Logo][logo]

[![Build Status](https://travis-ci.com/eglvote/voting.svg?branch=master)](https://travis-ci.com/eglvote/voting)

# Overview
The Ethereum Eagle project ($EGL) introduces a coordination utility for the Ethereum 1.x ecosystem to express its desired gas limit. While initially focused on influencing the ETH Gas Limit (EGL), it can be extended to affect other on-chain properties in the future.

+ The EGL token is a utility token to influence the ETH Gas Limit.
+ EGL holders vote on their desired gas limit, and pools are incentivized to follow their weight-average vote to collect free EGLs.
+ For pools to be incentivized to claim the free EGLs, EGLs must be bootstrapped with value. EGL’s Launch allows ETH holders to send ETH to the EGL smart contract, where its value will be matched (doubled) with EGLs, and deployed to an ETH-EGL Uniswap pool. The pool tokens are to be released after a period ranging between 10 weeks and 1 year.
+ EGLs are further awarded to EGL Voters to encourage early participation and bootstrap this decentralized coordination.
+ EGL has a theoretical limit of  4B EGLs (see below), of which up to 750M will be deployed to Uniswap at an initial ratio of 1/16,000  ETH.

# Smart Contracts
## Prerequisites
+ Install [Node.js][node.js]
+ Install [yarn][yarn]: `npm install --global yarn`
+ Install [Truffle][truffle]: `yarn global add truffle`
+ Install [Ganache-cli][ganache-cli]: `yarn global add ganache-cli`
+ Install project dependencies: `yarn install`

[Truffle][truffle] and [Ganache][ganache] are required to compile, test and deploy the smart contracts. In order to connect to the public networks (Ropsten/Mainnet), truffle requires an endpoint of an Ethereum node to connect to in order to send transactions to. This can either be a synced local node (like geth) or more conveniently, an [Infura][infura] node with API key. The `truffle-config.js` is currently configured to connect to Infura but requires an API key in order to connect. This key, as well as the wallet mnemonic used for deployments, is configured in a `.env` file which you will need to create. It is not (and should not be) committed to source control. 

There are 2 additional variables that you can specify:
+ `COIN_MARKET_CAP_API_KEY` - used by the gas reporter plugin to determine average gas costs of each function call based on the tests. Set this to an empty string if you don't have an API key. 
+ `ETHERSCAN_API_KEY` - used by the code verify plugin to verify the contract source code on etherscan. Set this to an empty string if you don't have an API key.

The `.env` file should take the following format:
```
MAINNET_NODE_URL=https://mainnet.infura.io/v3/<YOUR_API_KEY>
MAINNET_MNEMONIC="YOUR_MAINNET_MNEMONIC"

ROPSTEN_NODE_URL=https://ropsten.infura.io/v3/<YOUR_API_KEY>
ROPSTEN_MNEMONIC="YOUR_ROPSTEN_MNEMONIC"

KOVAN_NODE_URL=https://kovan.infura.io/v3/<YOUR_API_KEY>
KOVAN_MNEMONIC="YOUR_KOVAN_MNEMONIC"

RINKEBY_NODE_URL=https://rinkeby.infura.io/v3/<YOUR_API_KEY>
RINKEBY_MNEMONIC="YOUR_RINKEBY_MNEMONIC"

COIN_MARKET_CAP_API_KEY="YOUR_COIN_MARKET_CAP_API_KEY"
ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"
```

## General:
+ Compile contracts: `yarn compile`  
+ Run tests against local Ganache: `yarn test`  
+ Deploy contracts to local Ganache: `yarn mig-ganache`  
+ Deploy contracts to Ropsten: `yarn mig-ropsten`

### Interacting with Contracts from the console:
+ Start the console and connect to Ganache: `yarn con-ganache`  
+ Start the console and connect to Ropsten (requires Infura key configured in `.env`): `yarn con-ropsten`  

Code snippets for Truffle console:
```js
let accounts = await web3.eth.getAccounts()
(await web3.eth.getBlock("latest")).number

let token = await EglToken.deployed();
token.increaseAllowance(eagle.address, "10000000000000000000000")
token.transfer(accounts[1], web3.utils.toWei("1000"))
(await token.balanceOf(accounts[1])).toString()
(await token.totalSupply()).toString()

let eagle = await EglContract.deployed();
await eagle.vote(7000000, web3.utils.toWei("50000000"), 2, {from: accounts[0]});
await eagle.reVote(0, web3.utils.toWei("100"), 8, {from: accounts[0]})
await eagle.tallyVotes()
await eagle.withdraw({from: accounts[0]});
```

[logo]: assets/GithubBanner.svg
[truffle]: https://www.trufflesuite.com/truffle
[ganache]: https://www.trufflesuite.com/ganache
[ganache-cli]: https://github.com/trufflesuite/ganache-cli/blob/master/README.md
[infura]: https://infura.io/
[node.js]: https://nodejs.org/en/download/
[yarn]: https://yarnpkg.com/getting-started/install
