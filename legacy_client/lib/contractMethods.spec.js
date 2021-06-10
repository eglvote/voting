require('@openzeppelin/test-environment')
const { web3 } = require('@openzeppelin/test-helpers/src/setup')
const FactoryJson = require('@uniswap/v2-core/build/UniswapV2Factory.json')
const RouterJson = require('@uniswap/v2-periphery/build/UniswapV2Router02.json')
const { setupLoader } = require('@openzeppelin/contract-loader')
const loader = setupLoader({
    provider: web3, // either a web3 provider or a web3 instance
})

import BN from 'bn.js'
// const getContract = require('./getContract').default
import {
    vote,
    increaseAllowance,
    calculateCumulativeRewards,
} from './contractMethods'

const { accounts, contract } = require('@openzeppelin/test-environment')

const Contract = contract.fromArtifact('EglContract')
const Token = contract.fromArtifact('EglToken')
const Upgrader = contract.fromArtifact('EglUpgrader')
const TestableEglContract = contract.fromArtifact('TestableEglContract')

const ZeroAddress = '0x0000000000000000000000000000000000000000'
const DefaultEthToLaunch = new BN('5000000000000000000').toString()

// const IUniswapV2Factory = contract.fromArtifact(FactoryJson)
// console.log(Object.keys(RouterJson))
const UniswapV2Router = loader.truffle.fromABI(
    RouterJson.abi,
    RouterJson.bytecode,
    '0x1234567890123456789012345678901234567891'
)
// console.log(Upgrader)
const UpgraderInstance = loader.truffle.fromABI(
    Upgrader.abi,
    Upgrader.bytecode,
    '0x2234567890123456789012345678901234567891'
)
// console.log(UpgraderInstance)

const TestableEglContractInstance = loader.truffle.fromABI(
    TestableEglContract.abi,
    TestableEglContract.bytecode,
    '0x3234567890123456789012345678901234567891'
)
const DefaultVotePauseSeconds = 300
// console.log(TestableEglContractInstance)
// console.log('!!!', Object.keys(UniswapV2Router), UniswapV2Router)
let EglContract
let EglToken
let EglUpgrader
let routerContract
let eglContractDeployBlockNumber
let UniswapV2Factory
// let UniswapV2Router

async function giveFreeTokens(giftAccounts, eglToken) {
    let giftEgls = new BN('0')
    for (let [, address] of Object.entries(giftAccounts)) {
        await eglToken.transfer(address, '50000000000000000000000000')
        giftEgls = giftEgls.add(new BN('50000000000000000000000000'))
    }
    return giftEgls
}

describe('ContractMethods', function () {
    const [
        _deployer,
        _voter1,
        _voter2,
        _voter3,
        _voter4NoAllowance,
        _creator,
        _seed1,
        _seed2,
    ] = accounts
    const SEED_ACCOUNTS = [_seed1, _seed2]
    const CREATOR_REWARDS_ACCOUNT = _creator

    // console.log(SEED_ACCOUNTS, CREATOR_REWARDS_ACCOUNT)
    const DefaultEthToLaunch = new BN('5000000000000000000').toString()

    beforeEach(async function () {
        // UniswapV2Router.setProvider(web3._provider)

        // EglContract = await TestableEglContract.new()
        EglToken = await Token.new()
        // EglUpgrader = await Upgrader.new()
        let totalTokenSupply = new BN(web3.utils.toWei('4000000000'))
        await EglToken.initialize('EthereumGasLimit', 'EGL', totalTokenSupply)
        // let eglsGifted = await giveFreeTokens(SEED_ACCOUNTS, EglToken)

        // let eglContractDeploymentHash =
        //     TestableEglContractInstance.transactionHash
        // let eglContractDeploymentTransaction = await web3.eth.getTransaction(
        //     eglContractDeploymentHash
        // )

        // eglContractDeployBlockNumber =
        //     eglContractDeploymentTransaction.blockNumber
        // let eglContractDeploymentBlock = await web3.eth.getBlock(
        //     eglContractDeployBlockNumber
        // )
        // let eglContractDeploymentTimestamp =
        //     eglContractDeploymentBlock.timestamp
        // let eglUpgraderInstance = await Upgrader.deployed()

        let txReceipt = await TestableEglContractInstance.initialize(
            UpgraderInstance.address,
            EglToken.address,
            UniswapV2Router.address,
            DefaultEthToLaunch,
            '0',
            DefaultVotePauseSeconds,
            '300',
            '6700000',
            '7200000',
            SEED_ACCOUNTS,
            // eglsGifted,
            '0',
            CREATOR_REWARDS_ACCOUNT
        )

        console.log('txReceipt', txReceipt)

        // const balance = await EglToken.contract.methods
        //     .balanceOf(EglContract.address)
        //     .call()
        // console.log(balance)
        // EglContract.vote(4000000, '10', 2, ZeroAddress, 0, ZeroAddress, {
        //     from: owner,
        // })
        // const x = await EglContract.contract.methods.voterRewardSums(0).call()
        // const transfer = await EglToken.contract.methods
        //     .transfer(accounts[2], '50000000000000000000000000')
        //     .send({ from: _deployer })
        // const allowance = await EglToken.contract.methods
        //     .allowance(accounts[2], EglContract.address)
        //     .call()

        // const balance = await EglToken.contract.methods
        //     .balanceOf(accounts[7])
        //     .call()

        // console.log('transfer', transfer, allowance, balance)
    })

    it('the deployer is the owner', function () {
        expect(_deployer).toEqual(accounts[0])
    })

    it('currentEpoch', async function () {
        expect(
            await TestableEglContractInstance.contract.methods
                .currentEpoch()
                .call()
        ).toBe('0')
    })

    it('voterRewardSums', async function () {
        expect(
            await TestableEglContractInstance.contract.methods
                .voterRewardSums(0)
                .call()
        ).toBe('0')
    })

    // it('vote', async function () {
    //     // const allowance = await EglToken.contract.methods
    //     //     .allowance(accounts[2], EglContract.address)
    //     //     .call()
    //     await EglToken.contract.methods
    //         .increaseAllowance(
    //             EglContract.address,
    //             web3.utils.toWei('500000000000000')
    //         )
    //         .send({ from: accounts[2] })

    //     const allowance = await EglToken.contract.methods
    //         .allowance(accounts[2], EglContract.address)
    //         .call()

    //     const balance = await EglToken.contract.methods
    //         .balanceOf(accounts[2])
    //         .call()

    //     console.log('transfer', allowance, balance)

    //     const result = await vote(
    //         EglContract.contract,
    //         EglToken.contract,
    //         accounts[2],
    //         '1',
    //         '4000000',
    //         '3',
    //         ZeroAddress,
    //         '0',
    //         ZeroAddress,
    //         () => {}
    //     )
    //     expect(result).toBeTruthy()
    //     // expect(true).toBeTruthy()
    // })

    // it('calculateCumulativeRewards', async function () {
    //     const rewards = await calculateCumulativeRewards(
    //         0,
    //         0,
    //         1000000,
    //         3,
    //         EglContract.contract
    //     )
    //     // console.log(rewards)
    //     expect(rewards).toBe('0')
    // })

    it('calculateCumulativeRewards1', async function () {
        const rewards = await calculateCumulativeRewards(
            1,
            3,
            1000000,
            3,
            TestableEglContractInstance.contract
        )

        console.log(rewards)
        expect(rewards).toBe('0')
    })
    // it('calculateCumulativeRewards2', async function () {
    //     const rewards = await calculateCumulativeRewards(
    //         1,
    //         3,
    //         1000000,
    //         3,
    //         TestableEglContractInstance.contract
    //     )

    //     console.log(rewards)
    //     expect(rewards).toBe('0')
    // })
})

// test('web3', () => {
//     expect(web3).toBeTruthy()
// })

// test('accounts', async () => {
//     const Web3 = new web3()
//     const contract = await getContract(
//         web3,
//         '../src/contracts/EglContract.json'
//     )
//     console.log(Object.keys(contract))

//     expect(contract).toBeTruthy()
// })
