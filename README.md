![EGL Logo][logo]

[![Build Status](https://travis-ci.com/bloXroute-Labs/egl.svg?token=7P16gQwBsynsaBwrjxuH&branch=develop)](https://travis-ci.com/bloXroute-Labs/egl)

# Overview
The Ethereum Eagle project ($EGL) introduces a coordination utility for the Ethereum 1.x ecosystem to express its desired gas limit. While initially focused on influencing the ETH Gas Limit (EGL), it can be extended to affect other on-chain properties in the future.

+ The EGL token is a utility token to influence the ETH Gas Limit.
+ EGL holders vote on their desired gas limit, and pools are incentivized to follow their weight-average vote to collect free EGLs.
+ For pools to be incentivized to claim the free EGLs, EGLs must be bootstrapped with value. EGL’s Launch allows ETH holders to send ETH to the EGL smart contract, where its value will be matched (doubled) with EGLs, and deployed to an ETH-EGL Uniswap pool. The pool tokens are to be released after a period ranging between 10 weeks and 1 year.
+ EGLs are further awarded to EGL Voters to encourage early participation and bootstrap this decentralized coordination.
+ EGL has a theoretical limit of  4B EGLs (see below), of which up to 750M will be deployed to Uniswap at an initial ratio of 1/16,000  ETH.

# Development
# Smart Contracts
## Prerequisites:
[Truffle][truffle] and [Ganache][ganache] are required to compile, test and deploy the smart contracts. In order to connect to the public networks (Ropsten/Mainnet), truffle requires an endpoint of an Ethereum node to connect to in order to send transactions to. This can either be a synced local node (like geth) or more conveniently, an [Infura][infura] node with API key. The `truffle-config.js` is currently configured to connect to Infura but requires an API key in order to connect. This key, as well as the wallet mnemonic used for deployments, is configured in a `.env` file which you will need to create. It is not (and should not be) committed to source control. There is also a `COIN_MARKET_CAP_API_KEY` variable that is used by the gas reporter plugin. Set this to an empty string if you don't have a CoinMarketCap API key. 

The `.env` file should take the following format:
```
MAINNET_NODE_URL=https://mainnet.infura.io/v3/<YOUR_API_KEY>
MAINNET_MNEMONIC="YOUR_MAINNET_MNEMONIC"

ROPSTEN_NODE_URL=https://ropsten.infura.io/v3/<YOUR_API_KEY>
ROPSTEN_MNEMONIC="YOUR_ROPSTEN_MNEMONIC"

COIN_MARKET_CAP_API_KEY="YOUR_COIN_MARKET_CAP_API_KEY"
```
### Dependencies:
+ `npm install --global yarn`
+ `yarn global add truffle`
+ `yarn global add ganache-cli`

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
eagle.vote(7000000, web3.utils.toWei("50000000"), 2, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000", {from: accounts[0]});
eagle.reVote(0, web3.utils.toWei("100"), 8, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000", {from: accounts[0]})
eagle.tallyVotes()
eagle.withdraw({from: accounts[0]});
```

## Contract Addresses
Uniswap FactoryV2 - `0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f`  
Uniswap RouterV2 - `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D`  

[logo]: assets/GithubBanner.svg
[truffle]: https://www.trufflesuite.com/truffle
[ganache]: https://www.trufflesuite.com/ganache
[infura]: https://infura.io/
