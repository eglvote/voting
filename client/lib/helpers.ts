import web3 from 'web3'
// import BigNumber from 'bn.js'
import BigNumber from 'bignumber.js'

export const fromWei = (num) => web3.utils.fromWei(String(num))
export const toWei = (num) => web3.utils.toWei(String(num))

export const truncateEthAddress = (address) =>
    address.slice(0, 6) +
    '...' +
    address.slice(address.length - 4, address.length)

export const displayComma = (num) =>
    parseFloat(num).toLocaleString('en-US', {
        maximumFractionDigits: 3,
    })

export const calculateIndividualReward = (
    tokensLocked,
    lockupDuration,
    voteWeightsSum,
    reward
) => {
    if (
        !tokensLocked ||
        lockupDuration == 0 ||
        voteWeightsSum == 0 ||
        !reward
    ) {
        return 0
    }
    const voteWeight = new BigNumber(tokensLocked).multipliedBy(
        new BigNumber(lockupDuration)
    )

    const individualPercent = voteWeight.dividedBy(
        new BigNumber(voteWeightsSum)
    )

    const result = new BigNumber(reward)
        .multipliedBy(individualPercent)
        .toString()

    return result
}
