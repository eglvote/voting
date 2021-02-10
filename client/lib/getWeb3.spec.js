require('@openzeppelin/test-environment')
const { web3 } = require('@openzeppelin/test-helpers/src/setup')

import getWeb3 from './getWeb3'

// const web3 = getWeb3()

test('accounts', async () => {
    const accounts = await web3.eth.getAccounts()

    expect(accounts).toBeTruthy()
})
