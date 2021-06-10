import React from 'react'
import getWeb3 from './getWeb3'
import getContract from './getContract'
import contractDefinition from '../../lib/contracts/EglGenesis.json'

interface Web3ContainerProps {
    render: Function
    renderLoading: Function
}
export default class Web3Container extends React.Component<Web3ContainerProps> {
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
            const accounts = await web3.eth.getAccounts()
            const contract = await getContract(web3, contractDefinition)

            this.setState({ web3, accounts, contract })
        } catch (error) {
            alert(
                'Failed to load web3, accounts, or contract. Check console for details.'
            )
            console.log(error)
        }
    }

    render() {
        const { web3, accounts, contract } = this.state

        return web3 && accounts
            ? this.props.render({ web3, accounts, contract })
            : this.props.renderLoading()
    }
}
