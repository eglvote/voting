import web3 from 'web3'

const daoRecipient = '0x0000000000000000000000000000000000000000'
const daoAmount = 0
const upgradeAddress = '0x0000000000000000000000000000000000000000'

export const vote = async (
    contract,
    token,
    walletAddress,
    eglAmount,
    desiredChange,
    weeksLocked
) => {
    if (
        !contract ||
        !token ||
        !walletAddress ||
        eglAmount === undefined ||
        desiredChange === undefined ||
        weeksLocked === undefined ||
        eglAmount === '' ||
        desiredChange === '' ||
        weeksLocked === '' ||
        eglAmount < 0 ||
        desiredChange < 0 ||
        weeksLocked < 0
    ) {
        alert('Vote called with invalid parameters')
        return
    }

    const response = await contract.methods
        .vote(
            desiredChange, // desired change enum
            web3.utils.toWei(String(eglAmount)),
            String(weeksLocked),
            daoRecipient,
            daoAmount,
            upgradeAddress
        )
        .send({ from: walletAddress })
        .then((result, e) => {
            console.log('vote', result, e)
            if (!e) {
                console.log('Waiting for tx to be mined...', result)
            } else {
                console.log('Unable to send trans action', e)
            }
            return result
        })

    return response
}

export const revote = async (
    contract,
    token,
    walletAddress,
    eglAmount,
    desiredChange,
    weeksLocked
) => {
    if (
        !contract ||
        !token ||
        !walletAddress ||
        eglAmount === undefined ||
        desiredChange === undefined ||
        weeksLocked === undefined ||
        eglAmount === '' ||
        desiredChange === '' ||
        weeksLocked === '' ||
        eglAmount < 0 ||
        desiredChange < 0 ||
        weeksLocked < 0
    ) {
        alert('revote called with invalid parameters')
        return
    }

    const response = await contract.methods
        .reVote(
            desiredChange,
            web3.utils.toWei(String(eglAmount)),
            weeksLocked,
            daoRecipient,
            daoAmount,
            upgradeAddress
        )
        .send({ from: walletAddress })
        .then((result, e) => {
            console.log(result, e)
            if (!e) {
                console.log('Waiting for tx to be mined...', result)
            } else {
                console.log('Unable to send trans action', e)
            }
            return result
        })

    return response
}

export const getVoters = async (contract, walletAddress) => {
    if (!contract || !walletAddress) {
        alert('getVoters called with invalid parameters')
        return
    }

    const response = await contract.methods
        .voters(walletAddress)
        .call()
        .then((result) => {
            return result
        })

    return response
}

export const mint = async (contract, walletAddress) => {
    if (!contract || !walletAddress) {
        alert('mint called with invalid parameters')
        return
    }

    const response = await contract.methods
        .mint(walletAddress, web3.utils.toWei('1000000'))
        .send({ from: walletAddress })

    return response
}

export const increaseAllowance = async (contract, token, walletAddress) => {
    if (!contract || !walletAddress) {
        alert('increaseAllowance called with invalid parameters')
        return
    }

    const response = await token.methods
        .increaseAllowance(contract._address, web3.utils.toWei('50000000'))
        .send({ from: walletAddress })

    return response
}

export const tallyVotes = async (contract, walletAddress) => {
    if (!contract || !walletAddress) {
        alert('tallyVotes called with invalid parameters')
        return
    }

    const response = await contract.methods
        .tallyVotes()
        .send({ from: walletAddress })
        .then((result) => {
            console.log('tallyVotes', result)
            return result
        })

    return response
}

export const withdraw = async (contract, walletAddress) => {
    if (!contract || !walletAddress) {
        alert('withdraw called with invalid parameters')
        return
    }

    const response = await contract.methods
        .withdraw()
        .send({ from: walletAddress })
        .then((result) => {
            return result
        })

    return response
}

export const approve = async (token, walletAddress) => {
    if (!token || !walletAddress) {
        alert('approve called with invalid parameters')
        return
    }

    const response = await token.methods
        .approve(walletAddress, web3.utils.toWei('1000000'))
        .send({ from: walletAddress })

    return response
}

export const initialize = async (contract, walletAddress) => {
    if (!contract || !walletAddress) {
        alert('initialize called with invalid parameters')
        return
    }

    const response = await contract.methods
        .initialize(contract._address, web3.utils.toWei('1000000'))
        .send({ from: walletAddress })

    return response
}

export const allowance = async (contract, token, walletAddress) => {
    if (!contract || !token || !walletAddress) {
        alert('allowance called with invalid parameters')
        return
    }

    const response = await token.methods
        .allowance(walletAddress, contract._address)
        .call()

    return response
}

export const getLatestGasLimit = async (Web3) => {
    const result = await Web3.eth
        .getBlock('latest', false)
        .then((result, e) => {
            if (e) console.log(e)
            return result.gasLimit
        })
    return result
}

export const supportLaunch = async (contract, walletAddress, ethValue) => {
    if (!contract || !walletAddress) {
        alert('supportLaunch called with invalid parameters')
        return
    }

    const result = await contract.methods.supportLaunch().send({
        value: web3.utils.toWei(String(ethValue)),
        from: walletAddress,
    })

    return result
}

export const withdrawLiquidityTokens = async (contract, walletAddress) => {
    if (!contract || !walletAddress) {
        alert('supportLaunch called with invalid parameters')
        return
    }

    const result = await contract.methods.withdrawLiquidityTokens().send({
        from: walletAddress,
    })

    return result
}

export const getEglBalance = async (token, walletAddress) => {
    const eglBalance = await token.methods.balanceOf(walletAddress).call()
    return eglBalance
}
