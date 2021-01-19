import React, { componentDidMount } from 'react'
import Link from 'next/link'
import Web3Container from '../lib/Web3Container'
import VoteForm from '../components/organisms/VoteForm'
import RevoteForm from '../components/organisms/RevoteForm'
import {
  mint,
  getVoters,
  tallyVotes,
  increaseAllowance,
  withdraw,
  approve,
} from '../lib/contractMethods'
import Row from '../components/atoms/Row'
import Line from '../components/atoms/Line'
import styled from 'styled-components'
import connectToWeb3 from '../lib/connectToWeb3'

const Body = styled.div`
  margin-top: 2em;
  margin-left: 2em;
`
class Dapp extends React.Component {
  state = {
    ethBalance: null,
    eglBalance: null,
    voterData: null,
    votesTallied: null,
    walletAddress: this.props.accounts ? this.props.accounts[0] : null,
  }

  componentDidMount() {
    window.ethereum.on('accountsChanged', (accounts) => {
      this.setState({ walletAddress: accounts[0] })
    })
  }

  storeValue = async () => {
    const { accounts, contract } = this.props
    await contract.methods.set(5).send({ from: this.state.walletAddress })
    alert('Stored 5 into account')
  }

  getValue = async () => {
    const { contract } = this.props
    const response = await contract.methods
      .get()
      .call({ from: this.state.walletAddress })
    this.setState({ balance: response })
  }

  getEthBalance = async () => {
    const { web3 } = this.props
    if (this.state.walletAddress) {
      const balanceInWei = await web3.eth.getBalance(this.state.walletAddress)
      this.setState({ ethBalance: web3.utils.fromWei(balanceInWei) })
    } else {
      alert('Connect to Metamask!')
    }
  }

  getEglBalance = async () => {
    const { web3, token } = this.props
    if (this.state.walletAddress) {
      const response = await token.methods
        .balanceOf(this.state.walletAddress)
        .call()
      this.setState({ eglBalance: web3.utils.fromWei(response) })
    } else {
      alert('Connect to Metamask!')
    }
  }

  getContractData = async () => {
    const { contract } = this.props
    const response = await getVoters(contract, this.state.walletAddress)

    this.setState({ voterData: response })
  }

  allowance = () => {
    const { contract, token } = this.props

    increaseAllowance(contract, token, this.state.walletAddress)
  }

  tally = async () => {
    const { contract } = this.props

    if (this.state.walletAddress) {
      const response = await tallyVotes(contract, this.state.walletAddress)
      this.setState({ votesTallied: response.events.VotesTallied.returnValues })
    } else {
      alert('Connect to Metamask!')
    }
  }

  connectWebWallet = () => {
    connectToWeb3(window)
  }

  render() {
    const {
      balance = 'N/A',
      ethBalance = 'N/A',
      eglBalance = 'N/A',
      voterData = 'N/A',
      votesTallied = null,
    } = this.state

    console.log(this.state)
    return (
      <Body>
        <h1>Dapp</h1>
        <button onClick={this.connectWebWallet}>Connect to Metamask</button>
        <div style={{ 'margin-top': '1em' }}>
          <Link href="/accounts">
            <a>My Accounts</a>
          </Link>
        </div>
        <div>
          <Link href="/">
            <a>Home</a>
          </Link>
        </div>
        <Line />
        <div>
          <h3>Contract</h3>
          <button onClick={this.tally}>Tally Votes</button>
          <Row style={{ 'margin-top': '1em' }}>
            Address: {this.props.token._address}
          </Row>
          <Row>
            Total EGLs Locked:{' '}
            {voterData && web3.fromWei(voterData.tokensLocked)}
          </Row>
          <Row>Epoch: {votesTallied && votesTallied.currentEpoch}</Row>
          <Row>
            Up Votes: {votesTallied && web3.fromWei(votesTallied.totalVotesUp)}
          </Row>
          <Row>
            Same Votes:{' '}
            {votesTallied && web3.fromWei(votesTallied.totalVotesSame)}
          </Row>
          <Row>
            Down Votes:{' '}
            {votesTallied && web3.fromWei(votesTallied.totalVotesDown)}
          </Row>
        </div>
        <Line />
        <div>
          <h3>Wallet</h3>
          <button onClick={this.getContractData}>Get Contract Data</button>
          <button onClick={this.getEthBalance}>Get ether balance</button>
          <button onClick={this.getEglBalance}>Get EGL balance</button>
          <button onClick={this.allowance}>increaseAllowance 1 mil</button>
          <button
            onClick={() => approve(this.props.token, this.state.walletAddress)}
          >
            approve 1 mil
          </button>

          <button
            onClick={() => mint(this.props.token, this.state.walletAddress)}
          >
            mint 1 mil
          </button>
          <button
            onClick={() =>
              withdraw(this.props.contract, this.state.walletAddress)
            }
          >
            withdraw
          </button>
          <Row style={{ 'margin-top': '1em' }}>
            Address: {this.state.walletAddress}
          </Row>
          <Row>Ether Balance: {ethBalance}</Row>
          <Row>EGL Balance: {eglBalance}</Row>
          <Row>
            EGLs Locked: {voterData && web3.fromWei(voterData.tokensLocked)}
          </Row>
        </div>
        <Line />
        <VoteForm
          contract={this.props.contract}
          token={this.props.token}
          walletAddress={this.state.walletAddress}
        />
        <Line />
        <RevoteForm
          contract={this.props.contract}
          token={this.props.token}
          walletAddress={this.state.walletAddress}
        />
      </Body>
    )
  }
}

export default () => (
  <Web3Container
    renderLoading={() => <div>Loading Dapp Page...</div>}
    render={({ web3, accounts, contract, token }) => (
      <Dapp accounts={accounts} contract={contract} web3={web3} token={token} />
    )}
  />
)
