import React from 'react'
import getWeb3 from './getWeb3'
// import getWeb3Reader from './getWeb3Reader'
import getContract from './getContract'
import contractDefinition from '../src/contracts/EglContract.json'
import tokenDefinition from '../src/contracts/EglToken.json'

export default class Web3Container extends React.Component {
    state = {
        web3: null,
        web3Reader: null,
        accounts: null,
        contract: null,
        token: null,
    }

    async componentDidMount() {
        try {
            const web3 = await getWeb3()
            // const web3Reader = await getWeb3Reader()
            const accounts = await web3.eth.getAccounts()
            const contract = await getContract(web3, contractDefinition)
            const token = await getContract(web3, tokenDefinition)
            // this.setState({ web3, web3Reader, accounts, contract, token })
            this.setState({ web3, accounts, contract, token })
            // console.log('$%$%$%', this.state)
        } catch (error) {
            alert(
                'Failed to load web3, accounts, or contract. Check console for details.'
            )
            console.log(error)
        }
    }

    render() {
        // const { web3, web3Reader, accounts, contract, token } = this.state
        const { web3, accounts, contract, token } = this.state

        return web3 && accounts
            ? // ? this.props.render({ web3, web3Reader, accounts, contract, token })
              this.props.render({ web3, accounts, contract, token })
            : this.props.renderLoading()
    }
}
