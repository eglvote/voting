require('@openzeppelin/test-environment')
const { web3 } = require('@openzeppelin/test-helpers/src/setup')
// const getContract = require('./getContract').default
import { vote, calculateCumulativeRewards } from './contractMethods'

const { accounts, contract } = require('@openzeppelin/test-environment')

const Contract = contract.fromArtifact('EglContract')
const Token = contract.fromArtifact('EglToken')

let EglContract
let EglToken
describe('ContractMethods', function () {
    const [owner] = accounts

    console.log(accounts)
    beforeEach(async function () {
        EglContract = await Contract.new()
        EglToken = await Token.new()
    })

    // it('the deployer is the owner', async function () {
    //     expect(await contract.owner()).toEqual(owner)
    // })

    it('currentEpoch', async function () {
        expect(await EglContract.contract.methods.currentEpoch().call()).toBe(
            '0'
        )
    })

    it('voterRewardSums', async function () {
        expect(
            await EglContract.contract.methods.voterRewardSums(0).call()
        ).toBe('0')
    })

    it('vote', async function () {
        const result = await vote(
            EglContract.contract,
            EglToken.contract,
            accounts[2],
            1000000,
            3000000,
            3,
            () => {}
        )
        expect(result).toBeTruthy()
    })

    it('calculateCumulativeRewards', async function () {
        const rewards = await calculateCumulativeRewards(
            0,
            0,
            1000000,
            3,
            EglContract.contract
        )
        console.log(rewards)
        expect(rewards).toBe('0')
    })
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
