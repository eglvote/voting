import web3 from 'web3'

export const fromWei = (num) => {
    return web3.utils.fromWei(String(num))
}
