import React from 'react'
import Web3Container from '../lib/Web3Container'
import GenericPageTemplate from '../components/pageTemplates/GenericPageTemplate'
import { displayComma, fromWei } from '../lib/helpers'
import connectToWeb3 from '../lib/connectToWeb3'
import BigNumber from 'bignumber.js'
import { EGLS_AVAILABLE } from '../lib/constants'
import ArrowLink from '../components/molecules/ArrowLink'
import DaoVoteTable from '../components/organisms/VoteTables/DaoVoteTable'
import PastDaoVoteTable from '../components/organisms/VoteTables/PastDaoVoteTable'
import NestedBox from '../components/molecules/NestedBox'

interface DaoProps {
    accounts: any
    web3Reader?: any
    contract: any
    web3: any
    token: any
}

class Dao extends React.Component<DaoProps> {
    state = {
        walletAddress: this.props.accounts[0],
        eglBalance: 0,
        eglsAvailable: 0,
        eglsClaimed: 0,
        candidateAmountSum: null,
        candidate: null,
        pastVotes: [],
    }

    timeout = null

    componentWillMount() {
        this.ticker()

        window.ethereum.on('accountsChanged', (accounts) => {
            if (!accounts.length) {
                this.setState({
                    walletAddress: null,
                    eglBalance: 0,
                })
            } else {
                this.setState({
                    walletAddress: accounts[0],
                })
            }
        })
        const run = () => {
            this.ticker()
            this.timeout = setTimeout(run, 1000)
        }
        this.timeout = setTimeout(run, 1000)
    }

    componentWillUnmount() {
        clearInterval(this.timeout)
    }

    getAllEventsForType = async (eventName) => {
        const { contract } = this.props
        return await contract.getPastEvents(eventName, {
            fromBlock: 0,
            toBlock: 'latest',
        })
    }

    ticker = async () => {
        const { contract, token } = this.props
        console.log('dao', this.timeout)

        const eglBalance = this.state.walletAddress
            ? await token.methods.balanceOf(this.state.walletAddress).call()
            : 0
        const eventEglsMatched = await this.getAllEventsForType('EglsMatched')

        const eglsClaimed = eventEglsMatched.reduce(
            (acc, e) =>
                new BigNumber(acc).plus(
                    new BigNumber(e.returnValues.eglsMatched)
                ),
            0
        )
        const eglsAvailable = new BigNumber(EGLS_AVAILABLE).minus(eglsClaimed)

        const eventCandidateVoteAdded = await this.getAllEventsForType(
            'CandidateVoteAdded'
        )

        const eventCandidateVoteEvaluated = await this.getAllEventsForType(
            'CandidateVoteEvaluated'
        )

        const pastVotes =
            eventCandidateVoteEvaluated.length != 0
                ? eventCandidateVoteEvaluated.map((event) => ({
                      date: event.returnValues.date,
                      candidateAmountSum:
                          event.returnValues.leadingCandidateAmount,
                      candidate: event.returnValues.leadingCandidate,
                      percentage: event.returnValues.totalVotePercentage,
                      status: event.returnValues.thresholdPassed,
                  }))
                : [
                      {
                          date: '0',
                          candidateAmountSum: '0',
                          candidate: null,
                          percentage: '0',
                          status: null,
                      },
                  ]

        const currentCadidateVote =
            eventCandidateVoteAdded[eventCandidateVoteAdded.length - 1]

        const candidateAmountSum = currentCadidateVote
            ? new BigNumber(currentCadidateVote.returnValues.candidateAmountSum)
                  .dividedBy(
                      new BigNumber(
                          currentCadidateVote.returnValues.candidateVoteCount
                      )
                  )
                  .toFixed()
            : '0'
        this.setState({
            eglBalance,
            eglsClaimed: eglsClaimed.toFixed(),
            eglsAvailable: eglsAvailable.toFixed(),
            candidateAmountSum:
                eventCandidateVoteAdded.length > 0 ? candidateAmountSum : '0',
            candidate:
                eventCandidateVoteAdded.length > 0
                    ? eventCandidateVoteAdded[
                          eventCandidateVoteAdded.length - 1
                      ].returnValues.candidate
                    : '0',
            pastVotes,
        })
    }

    render() {
        const {
            walletAddress,
            eglBalance,
            eglsClaimed,
            eglsAvailable,
        } = this.state
        const { contract, token } = this.props

        return (
            <GenericPageTemplate
                connectWeb3={() => connectToWeb3(window)}
                walletAddress={walletAddress}
                eglBalance={String(eglBalance)}
            >
                <div className={'p-12 bg-hailStorm flex justify-center'}>
                    <div className={'w-4/5'}>
                        <h1 className={'text-salmon text-6xl font-extrabold'}>
                            DAO<span className={'text-black'}>.</span>
                        </h1>
                        <div className={'w-32'}>
                            <ArrowLink
                                className={'ml-1 my-2'}
                                title={'LEARN MORE'}
                                color={'babyBlue'}
                            />
                        </div>
                        <h3 className={'text-2xl font-bold mt-8'}>
                            Funds available
                        </h3>
                        <div
                            className={'flex justify-center items-start mt-20'}
                        >
                            <div>
                                <NestedBox
                                    title={'EGLs AVAILABLE'}
                                    className={'bg-plum-dark'}
                                    nestedColor={'bg-plum'}
                                >
                                    <p
                                        className={
                                            'font-extrabold text-4xl text-white text-center'
                                        }
                                    >
                                        {displayComma(fromWei(eglsAvailable)) ||
                                            'N/A'}
                                    </p>
                                </NestedBox>
                            </div>
                        </div>
                        <div className={'flex justify-center'}>
                            <div
                                className={
                                    'p-8 mt-8 bg-white rounded-xl border'
                                }
                            >
                                <p className={'mt-4'}>
                                    EGL is a fully decentralized protocol. The
                                    EGL DAO was created to fund and support
                                    further development of the protocol. Any
                                    future development of the EGL contract,
                                    security audits, or any other improvement or
                                    advancement of EGL are to be taken by the
                                    Ethereum community, and EGL holders, not by
                                    the EGL creators.{' '}
                                </p>
                                <p className={'mt-4'}>
                                    Allocation of these funds is decided upon by
                                    the EGL voters as part of the voting
                                    process.
                                </p>
                                <p className={'mt-4'}>
                                    EGL voters can distribute up to 5M EGLs per
                                    vote from the DAO to be sent to a specified
                                    address. For DAO funds to be distributed, at
                                    least 20% of the circulating EGLS must
                                    participate in the vote, and their majority
                                    (over 50%) must specify the same single
                                    address. Furthermore, the DAO recipient
                                    address must be voted on to receive funds in
                                    two consecutive weeks.
                                </p>
                                <p className={'mt-4'}>
                                    The weighted average of all the voters who
                                    voted in favor of distributing funds is used
                                    to determine the exact amount to be
                                    distributed to the specified address.
                                </p>
                            </div>
                        </div>
                        <h1
                            className={
                                'mt-8 mb-4 text-2xl font-extrabold text-left'
                            }
                        >
                            Current Dao Votes
                        </h1>
                        <p>
                            Addresses must receive over 20% of the votes in two
                            consecutive weeks.
                        </p>
                        <div className={'flex w-full justify-start flex-wrap'}>
                            <div className={'mr-16 py-8 '}>
                                <h3 className={'text-lg mb-4 font-extrabold'}>
                                    Second Round DAO Votes
                                </h3>
                                <DaoVoteTable
                                    amount={
                                        this.state.candidateAmountSum
                                            ? this.state.candidateAmountSum
                                            : '0'
                                    }
                                    walletAddress={this.state.candidate}
                                />
                            </div>
                            <div className={'py-8 '}>
                                <h3 className={'text-lg mb-4 font-extrabold'}>
                                    First Round DAO Votes
                                </h3>
                                <DaoVoteTable
                                    amount={
                                        this.state.candidateAmountSum
                                            ? this.state.candidateAmountSum
                                            : '0'
                                    }
                                    walletAddress={this.state.candidate}
                                />
                            </div>
                        </div>
                        <div className={'py-8'}>
                            <h3 className={'text-lg mb-4 font-extrabold'}>
                                Past DAO Votes
                            </h3>
                            <PastDaoVoteTable
                                pastVotes={this.state.pastVotes}
                            />
                        </div>
                    </div>
                </div>
            </GenericPageTemplate>
        )
    }
}

export default () => (
    <Web3Container
        renderLoading={() => (
            <GenericPageTemplate
                connectWeb3={null}
                walletAddress={null}
                eglBalance={null}
            >
                <div
                    style={{ animation: `fadeIn 1s` }}
                    className="opacity-25 fixed inset-0 z-30 bg-black"
                />
            </GenericPageTemplate>
        )}
        render={({ web3, accounts, contract, token }) => (
            <Dao
                accounts={accounts}
                contract={contract}
                web3={web3}
                token={token}
            />
        )}
    />
)
