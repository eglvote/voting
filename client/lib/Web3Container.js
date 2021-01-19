import React from 'react'
import getWeb3 from './getWeb3'
import getContract from './getContract'
import contractDefinition from '../src/contracts/EglContract.json'
import tokenDefinition from '../src/contracts/EglToken.json'
import bootstrap from '../../bootstrap-data'

export default class Web3Container extends React.Component {
  state = { web3: null, accounts: null, contract: null, token: null }

  async componentDidMount() {
    try {
      const web3 = await getWeb3()
      const accounts = await web3.eth.getAccounts()
      const contract = await getContract(web3, contractDefinition)
      const token = await getContract(web3, tokenDefinition)
      console.log(contract, token, accounts, web3)
      this.setState({ web3, accounts, contract, token })
    } catch (error) {
      alert(
        'Failed to load web3, accounts, or contract. Check console for details.'
      )
      console.log(error)
    }
  }

  render() {
    const { web3, accounts, contract, token } = this.state
    return web3 && accounts
      ? this.props.render({ web3, accounts, contract, token })
      : this.props.renderLoading()
  }
}
