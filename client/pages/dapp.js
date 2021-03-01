import React, { componentDidMount, componentWillUnmount } from 'react'
import Link from 'next/link'
import Web3Container from '../lib/Web3Container'
import VoteForm from '../components/organisms/VoteForm'
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
import { fromWei, displayComma } from '../lib/helpers'
import BN from 'bn.js'
import SupportLaunchForm from '../components/organisms/SupportLaunchForm'
import GenericPageTemplate from '../components/pageTemplates/GenericPageTemplate'

const ALERT_MESSAGE = 'Please connect to Metamask'
const IS_DEV = false

const Body = styled.div`
    margin-top: 7em;
    margin-left: 2em;
`
const Button = styled.button`
    border: 1px solid black;
    border-radius: 5px;
    padding: 0.5em;
    padding-left: 1em;
    padding-right: 1em;
    margin-right: 1em;
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
        baselineEgl: null,
        desiredEgl: null,
        averageVote: null,
    }

    componentDidMount() {
        window.ethereum.on('accountsChanged', (accounts) => {
            this.setState({ walletAddress: accounts[0] })
        })

        const interval = () => {
            this.state.walletAddress && this.ticker()
            this.timeout = setTimeout(() => interval(), 1000)
        }

        interval()
    }

    componentWillUnmount() {
        clearInterval(this.interval)
    }

    ticker = async () => {
        const { web3, contract, token } = this.props

        const currentEpoch = await contract.methods.currentEpoch().call()
        const epochEndDate = m.unix(
            parseInt(await contract.methods.currentEpochStartDate().call()) +
                300
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

        const baselineEgl = await contract.methods.baselineEgl().call()
        const desiredEgl = await contract.methods.desiredEgl().call()

        const gasTargetSum = await contract.methods.gasTargetSum(0).call()
        const voteWeightsSum = await contract.methods.voteWeightsSum(0).call()

        let averageVote

        if (voteWeightsSum !== '0' && gasTargetSum !== '0') {
            averageVote = new BN(gasTargetSum).div(new BN(voteWeightsSum))
        } else {
            averageVote = 0
        }

        this.setState({
            currentEpoch,
            timeToNextEpoch,
            allowance: getAllowance,
            eglBalance: eglBalance,
            voterData,
            ethBalance: fromWei(ethBalance),
            baselineEgl,
            desiredEgl,
            averageVote,
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
                votesTallied:
                    transactionReceipt.events.VotesTallied.returnValues,
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
            // <GenericPageTemplate
            //     connectWeb3={this.connectWebWallet}
            //     walletAddress={this.state.walletAddress}
            //     eglBalance={eglBalance}
            // >
            <Body>
                <h1 className={'font-bold text-2xl'}>Dapp</h1>
                {/* <Button
                        className={'hover:bg-gray-300'}
                        onClick={this.connectWebWallet}
                    >
                        Connect to Metamask
                    </Button> */}
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
                    <Button
                        className={'hover:bg-gray-300'}
                        onClick={this.tally}
                    >
                        Tally Votes
                    </Button>
                    <Row style={{ marginTop: '1em' }}>
                        Address: {this.props.token._address}
                    </Row>
                    <Row>{`Time to Next Epoch: ${this.state.timeToNextEpoch}`}</Row>
                    <Row>{`Current Epoch: ${this.state.currentEpoch}`}</Row>
                    <Row>{`Actual Gas Limit:  ${this.state.baselineEgl}`}</Row>
                    <Row>{`Desired Gas Limit:  ${this.state.desiredEgl}`}</Row>
                    <Row>{`Average Vote:  ${this.state.averageVote}`}</Row>
                </div>
                <div>
                    <SectionHeader>Wallet</SectionHeader>
                    <Button
                        className={'hover:bg-gray-300 mb-5'}
                        onClick={this.allowance}
                    >
                        increaseAllowance 50 mil
                    </Button>
                    {IS_DEV && (
                        <Button
                            className={'hover:bg-gray-300'}
                            onClick={() =>
                                approve(
                                    this.props.token,
                                    this.state.walletAddress
                                )
                            }
                        >
                            approve 1 mil
                        </Button>
                    )}
                    {IS_DEV && (
                        <Button
                            className={'hover:bg-gray-300'}
                            onClick={() =>
                                mint(this.props.token, this.state.walletAddress)
                            }
                        >
                            mint 1 mil
                        </Button>
                    )}
                    <Button
                        className={'hover:bg-gray-300'}
                        onClick={() =>
                            withdraw(
                                this.props.contract,
                                this.state.walletAddress
                            )
                        }
                    >
                        withdraw
                    </Button>
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
                                                displayComma(
                                                    fromWei(eglBalance)
                                                )}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <b>EGLs Locked: </b>
                                        {voterData && (
                                            <span>
                                                {parseFloat(
                                                    fromWei(
                                                        voterData.tokensLocked
                                                    )
                                                ).toLocaleString('en-US', {
                                                    maximumFractionDigits: 3,
                                                })}
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
                                                          .unix(
                                                              voterData.releaseDate
                                                          )
                                                          .format(
                                                              'dddd, MMMM Do, YYYY h:mm:ss A'
                                                          )
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
                                                    web3.utils.fromWei(
                                                        String(
                                                            this.state.allowance
                                                        )
                                                    )
                                                ).toLocaleString('en-US', {
                                                    maximumFractionDigits: 3,
                                                })}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <SupportLaunchForm
                    contract={this.props.contract}
                    token={this.props.token}
                    walletAddress={this.state.walletAddress}
                />
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
            // </GenericPageTemplate>
        )
    }
}

export default () => (
    <Web3Container
        renderLoading={() => (
            // <GenericPageTemplate
            //     connectWeb3={null}
            //     walletAddress={null}
            //     eglBalance={null}
            // >
            <div
                style={{ animation: `fadeIn 1s` }}
                className="opacity-25 fixed inset-0 z-30 bg-black"
            />
            // </GenericPageTemplate>
        )}
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
