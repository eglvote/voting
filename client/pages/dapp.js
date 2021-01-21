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
  allowance,
  withdraw,
  approve,
} from '../lib/contractMethods'
import Row from '../components/atoms/Row'
import styled from 'styled-components'
import connectToWeb3 from '../lib/connectToWeb3'
import web3 from 'web3'
import SectionHeader from '../components/atoms/SectionHeader'
import m from 'moment'

const ALERT_MESSAGE = 'Please connect to Metamask'
const IS_DEV = false

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
    allowance: null,
    walletAddress: this.props.accounts ? this.props.accounts[0] : null,
  }

  componentDidMount() {
    const { web3, accounts, contract, token } = this.props
    window.ethereum.on('accountsChanged', (accounts) => {
      this.setState({ walletAddress: accounts[0] })
    })
  }

  getEthBalance = async () => {
    const { web3 } = this.props
    if (this.state.walletAddress) {
      const balanceInWei = await web3.eth.getBalance(this.state.walletAddress)
      this.setState({ ethBalance: web3.utils.fromWei(balanceInWei) })
    } else {
      alert(ALERT_MESSAGE)
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
      alert(ALERT_MESSAGE)
    }
  }

  getContractData = async () => {
    const { contract } = this.props

    if (this.state.walletAddress) {
      const response = await getVoters(contract, this.state.walletAddress)
      this.setState({ voterData: response })
    } else {
      alert(ALERT_MESSAGE)
    }
  }

  allowance = () => {
    const { contract, token } = this.props
    if (this.state.walletAddress) {
      increaseAllowance(contract, token, this.state.walletAddress)
    } else {
      alert(ALERT_MESSAGE)
    }
  }

  tally = async () => {
    const { contract } = this.props

    if (this.state.walletAddress) {
      const transactionReceipt = await tallyVotes(
        contract,
        this.state.walletAddress
      )
      console.log('ggga', transactionReceipt)
      this.setState({
        votesTallied: transactionReceipt.events.VotesTallied.returnValues,
      })
    } else {
      alert(ALERT_MESSAGE)
    }
  }

  getAllowance = async () => {
    const { contract, token } = this.props

    if (this.state.walletAddress) {
      const response = await allowance(
        contract,
        token,
        this.state.walletAddress
      )
      this.setState({ allowance: response })
    } else {
      alert(ALERT_MESSAGE)
    }
  }

  connectWebWallet = () => {
    connectToWeb3(window)
  }

  render() {
    const {
      ethBalance = null,
      eglBalance = null,
      voterData = null,
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
        <div>
          <Link href="/status">
            <a>Status</a>
          </Link>
        </div>
        <div>
          <SectionHeader>Contract</SectionHeader>
          <button onClick={this.tally}>Tally Votes</button>
          <Row style={{ 'margin-top': '1em' }}>
            Address: {this.props.token._address}
          </Row>
          <Row>Epoch: {votesTallied && votesTallied.currentEpoch}</Row>
          <Row>
            Up Votes:{' '}
            {votesTallied && web3.utils.fromWei(votesTallied.totalVotesUp)}
          </Row>
          <Row>
            Same Votes:{' '}
            {votesTallied && web3.utils.fromWei(votesTallied.totalVotesSame)}
          </Row>
          <Row>
            Down Votes:{' '}
            {votesTallied && web3.utils.fromWei(votesTallied.totalVotesDown)}
          </Row>
        </div>
        <div>
          <SectionHeader>Wallet</SectionHeader>
          <button onClick={this.getEthBalance}>Get ether balance</button>
          <button onClick={this.getEglBalance}>Get EGL balance</button>
          <button onClick={this.getContractData}>Get Locked EGL</button>
          <button onClick={this.getAllowance}>Get Allowance</button>
          <button onClick={this.allowance}>increaseAllowance 1 mil</button>
          {IS_DEV && (
            <button
              onClick={() =>
                approve(this.props.token, this.state.walletAddress)
              }
            >
              approve 1 mil
            </button>
          )}

          {IS_DEV && (
            <button
              onClick={() => mint(this.props.token, this.state.walletAddress)}
            >
              mint 1 mil
            </button>
          )}
          <button
            onClick={() =>
              withdraw(this.props.contract, this.state.walletAddress)
            }
          >
            withdraw
          </button>
          <div>
            <table style={{ 'margin-top': '1em' }}>
              <tr>
                <td>
                  <b>Address: </b>
                  <span>{this.state.walletAddress}</span>
                </td>
              </tr>
              <tr>
                <td>
                  <b>Ether Balance: </b>
                  <span>{ethBalance}</span>
                </td>
              </tr>
              <tr>
                <td>
                  <b>EGL Balance: </b>
                  <span>
                    {eglBalance &&
                      parseFloat(eglBalance).toLocaleString('en-US', {
                        maximumFractionDigits: 3,
                      })}
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <b>EGLs Locked: </b>
                  {voterData && (
                    <span>{web3.utils.fromWei(voterData.tokensLocked)}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  <b>Release Date: </b>
                  {voterData && (
                    <span>
                      {m
                        .unix(voterData.releaseDate)
                        .format('dddd, MMMM Do, YYYY h:mm:ss A')}
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  <b>Allowance: </b>
                  <span>
                    {this.state.allowance &&
                      parseFloat(
                        web3.utils.fromWei(String(this.state.allowance))
                      ).toLocaleString('en-US', { maximumFractionDigits: 3 })}
                  </span>
                </td>
              </tr>
            </table>
          </div>
        </div>
        <VoteForm
          contract={this.props.contract}
          token={this.props.token}
          walletAddress={this.state.walletAddress}
        />
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
