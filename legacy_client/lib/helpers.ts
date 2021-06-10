import web3 from 'web3'
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

export const formatFromWei = (num) => displayComma(fromWei(num))

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

const pad = (int, digits) =>
    int.length >= digits
        ? int
        : new Array(digits - int.length + 1).join('0') + int

export const zeroPad = (str, digits) => {
    str = String(str)
    const nums = str.match(/[0-9]+/g)

    nums.forEach((num) => {
        str = str.replace(num, pad(num, digits))
    })

    return str
}

export const formatBigNumberAttribute = (attribute) => {
    if (attribute === null || attribute === undefined) return attribute
    return parseFloat(web3.utils.fromWei(attribute)).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 18,
    })
}

export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)
