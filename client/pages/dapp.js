import React, { componentDidMount, componentWillUnmount } from 'react'
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
import { fromWei } from '../lib/helpers'

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
    currentEpoch: null,
    timeToNextEpoch: null,
  }

  componentDidMount() {
    const { web3, web3Reader, accounts, contract, token } = this.props

    window.ethereum.on('accountsChanged', (accounts) => {
      this.setState({ walletAddress: accounts[0] })
    })

    this.interval = setInterval(() => {
      this.ticker()
    }, 1000)

    // web3Reader.eth
    //   .subscribe('pendingTransactions', (e, event) => {
    //     console.log('pendingTransactions', e, event)
    //   })
    //   .on('data', (transaction) => {
    //     console.log('data', transaction)
    //   })

    // web3Reader.eth
    //   .subscribe('newBlockHeaders', (e, event) => {
    //     console.log('newBlockHeaders', e, event)
    //   })
    //   .on('connected', function (subscriptionId) {
    //     console.log('connected', subscriptionId)
    //   })
    //   .on('data', function (blockHeader) {
    //     console.log('newBlockHeaders', blockHeader)
    //   })

    // web3Reader.eth
    //   .subscribe(
    //     'logs',
    //     {
    //       address: this.state.walletAddress,
    //       topics: contract._jsonInterface
    //         .filter((element) => element.type === 'event')
    //         .map((event) => event.signature),
    //     },
    //     function (error, result) {
    //       if (!error) console.log(result)
    //     }
    //   )
    //   .on('connected', function (subscriptionId) {
    //     console.log(subscriptionId)
    //   })
    //   .on('data', function (log) {
    //     console.log('log data', log)
    //   })
    //   .on('changed', function (log) {})
  }

  componentWillUnmount() {
    const { web3Reader } = this.props
    web3Reader.eth.clearSubscriptions()
    clearInterval(this.interval)
  }

  ticker = async () => {
    const { web3, contract, token } = this.props

    const currentEpoch = await contract.methods.currentEpoch().call()
    const epochEndDate = m.unix(
      parseInt(await contract.methods.currentEpochStartDate().call()) + 300
    )
    const countdown = m.duration(epochEndDate - m())
    const timeToNextEpoch =
      countdown.days() +
      ' days ' +
      countdown.hours() +
      ' hours ' +
      countdown.minutes() +
      ' minutes ' +
      countdown.seconds() +
      ' seconds'
    const getAllowance = await allowance(
      contract,
      token,
      this.state.walletAddress
    )

    const eglBalance = await token.methods
      .balanceOf(this.state.walletAddress)
      .call()

    const voterData = await getVoters(contract, this.state.walletAddress)

    const ethBalance = await web3.eth.getBalance(this.state.walletAddress)

    this.setState({
      currentEpoch,
      timeToNextEpoch,
      allowance: getAllowance,
      eglBalance: fromWei(eglBalance),
      voterData,
      ethBalance: fromWei(ethBalance),
    })
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
      this.setState({
        votesTallied: transactionReceipt.events.VotesTallied.returnValues,
      })
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

    return (
      <Body>
        <h1>Dapp</h1>
        <button onClick={this.connectWebWallet}>Connect to Metamask</button>
        <div style={{ marginTop: '1em' }}>
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
          <Row style={{ marginTop: '1em' }}>
            Address: {this.props.token._address}
          </Row>
          <Row>{`Current Epoch: ${this.state.currentEpoch}`}</Row>
          <Row>{`Time to Next Epoch:  ${this.state.timeToNextEpoch}`}</Row>
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
          <button onClick={this.allowance}>increaseAllowance 50 mil</button>
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
            <table style={{ margintTop: '1em' }}>
              <tbody>
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
                      <span>
                        {parseFloat(
                          web3.utils.fromWei(voterData.tokensLocked)
                        ).toLocaleString('en-US', { maximumFractionDigits: 3 })}
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td>
                    <b>Release Date: </b>
                    {voterData && (
                      <span>
                        {voterData.releaseDate !== '0'
                          ? m
                              .unix(voterData.releaseDate)
                              .format('dddd, MMMM Do, YYYY h:mm:ss A')
                          : 'N/A'}
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
              </tbody>
            </table>
          </div>
        </div>
        <VoteForm
          contract={this.props.contract}
          token={this.props.token}
          walletAddress={this.state.walletAddress}
          hasNotVoted={true}
        />
        <VoteForm
          contract={this.props.contract}
          token={this.props.token}
          walletAddress={this.state.walletAddress}
          hasNotVoted={false}
        />
      </Body>
    )
  }
}

export default () => (
  <Web3Container
    renderLoading={() => <div>Loading Dapp Page...</div>}
    render={({ web3, web3Reader, accounts, contract, token }) => (
      <Dapp
        accounts={accounts}
        web3Reader={web3Reader}
        contract={contract}
        web3={web3}
        token={token}
      />
    )}
  />
)
