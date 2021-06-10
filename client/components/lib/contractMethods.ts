import { BonusEglSupply } from './constants'

export const sendEth = (
    web3,
    contract,
    walletAddress,
    amount,
    callback,
    setError
) => {
    web3.eth
        .sendTransaction({
            from: walletAddress,
            to: contract._address,
            value: web3.utils.toWei(amount),
        })
        .on('transactionHash', function(hash) {
            console.log('transactionHash', hash)
            callback()
        })
        .on('receipt', function(receipt) {
            console.log(receipt)
        })
        .on('error', function(error, receipt) {
            console.log('error', error.message, receipt)
            console.log(Object.keys(error.message))
            setError(error.message)
        })
}

export const calculateBonusEgls = () => {}
