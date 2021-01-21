import web3 from 'web3'
import BN from 'bn.js'

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
    (!contract, !token, !walletAddress, !amount, !desiredChange, !weeksLocked)
  ) {
    alert('Connect to Metamask!')
    return
  }

  // if (weeksLocked < 1 && weeksLocked > 0) weeksLocked = 0
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
      console.log(result, e)
      if (!e) {
        console.log('Waiting for tx to be mined...', result)
      } else {
        console.log('Unable to send trans action', e)
      }
    })

  return response
}

export const revote = async (
  contract,
  token,
  walletAddress,
  amount,
  desiredChange,
  weeksLocked
) => {
  if (
    (!contract, !token, !walletAddress, !amount, !desiredChange, !weeksLocked)
  ) {
    alert('Connect to Metamask!')
    return
  }

  if (weeksLocked < 1 && weeksLocked > 0) weeksLocked = 0
  const response = await contract.methods
    .reVote(
      desiredChange,
      web3.utils.toWei(String(amount)),
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
  if ((!contract, !walletAddress)) {
    alert('Connect to Metamask!')
    return
  }

  const response = await contract.methods
    .voters(walletAddress)
    .call((e, tx) => {
      console.log('etx', e, tx)
    })
    .then((result) => {
      return result
    })

  return response
}

export const mint = async (contract, walletAddress) => {
  if ((!contract, !walletAddress)) {
    alert('Connect to Metamask!')
    return
  }

  const response = await contract.methods
    .mint(walletAddress, web3.utils.toWei('1000000'))
    .send({ from: walletAddress })

  return response
}

export const increaseAllowance = async (contract, token, walletAddress) => {
  if ((!contract, !walletAddress)) {
    alert('Connect to Metamask!')
    return
  }

  const response = await token.methods
    .increaseAllowance(contract._address, web3.utils.toWei('50000000'))
    .send({ from: walletAddress })

  return response
}

export const tallyVotes = async (contract, walletAddress) => {
  if ((!contract, !walletAddress)) {
    alert('Connect to Metamask!')
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
  if ((!contract, !walletAddress)) {
    alert('Connect to Metamask!')
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
  if ((!token, !walletAddress)) {
    alert('Connect to Metamask!')
    return
  }

  const response = await token.methods
    .approve(walletAddress, web3.utils.toWei('1000000'))
    .send({ from: walletAddress })

  return response
}

export const initialize = async (contract, walletAddress) => {
  if ((!contract, !walletAddress)) {
    alert('Connect to Metamask!')
    return
  }

  const response = await contract.methods
    .initialize(contract._address, web3.utils.toWei('1000000'))
    .send({ from: walletAddress })

  return response
}
