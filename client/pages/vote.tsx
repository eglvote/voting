import React from 'react'
import GenericPageTemplate from '../components/pageTemplates/GenericPageTemplate'
import Web3Container from '../lib/Web3Container'
import connectToWeb3 from '../lib/connectToWeb3'
import Button from '../components/atoms/Button'
import VoteModal from '../components/organisms/VoteModal/VoteModal'
import RevoteModal from '../components/organisms/VoteModal/RevoteModal'
import {
    getVoters,
    getLatestGasLimit,
    tallyVotes,
    allowance,
    calculateCumulativeRewards,
} from '../lib/contractMethods'
import { displayComma, truncateEthAddress, toWei } from '../lib/helpers'
import BigNumber from 'bignumber.js'
import m from 'moment'
import { REWARD_MULTIPLIER } from '../lib/constants'
import HowToVote from '../components/organisms/HowToVote'
import YourVoteTable from '../components/organisms/VoteTables/YourVoteTable'
import WithdrawTable from '../components/organisms/VoteTables/WithdrawTable'
import SmartButton from '../components/molecules/SmartButton'
import ArrowLink from '../components/molecules/ArrowLink'
import Countdown from '../components/organisms/Countdown'
import NestedBox from '../components/molecules/NestedBox'

declare global {
    interface Window {
        ethereum: any
    }
}

interface VoteProps {
    accounts: any
    web3Reader?: any
    contract: any
    web3: any
    token: any
}

class Vote extends React.Component<VoteProps> {
    state = {
        timeToNextEpoch: m.duration('0'), //pass time stamp, calc on component
        tokensLocked: '0',
        releaseDate: '0',
        gasTarget: '0',
        lockupDuration: '0',
        baselineEgl: null,
        totalEglReward: null,
        voterReward: '0',
        lockupDate: '0',
        eglBalance: '0',
        walletAddress: this.props.accounts ? this.props.accounts[0] : null,
        voteClicked: false,
        revoteClicked: false,
        tokensUnlocked: '0',
        currentAllowance: '0',
        epochLength: '300',
        daoAmount: '0',
        daoRecipient: '0x0000000000000000000000000000000000000000',
        upgradeAddress: '0x0000000000000000000000000000000000000000',
        previousEpochDaoSum: '0',
        previousEpochDaoCandidate: '0x0000000000000000000000000000000000000000',
        previousEpochUpgradeCandidate:
            '0x0000000000000000000000000000000000000000',
    }

    timeout = null

    componentWillMount() {
        this.ticker()

        window.ethereum.on('accountsChanged', (accounts) => {
            if (!accounts.length) {
                this.setState({
                    tokensLocked: '0',
                    releaseDate: null,
                    gasTarget: null,
                    lockupDuration: null,
                    voterReward: null,
                    lockupDate: null,
                    eglBalance: '0',
                    walletAddress: null,
                    voteClicked: false,
                    revoteClicked: false,
                    tokensUnlocked: '0',
                    currentAllowance: '0',
                    epochLength: '300',
                    daoAmount: '0',
                    daoRecipient: '0x0000000000000000000000000000000000000000',
                    upgradeAddress:
                        '0x0000000000000000000000000000000000000000',
                    previousEpochDaoSum: '0',
                    previousEpochDaoCandidate:
                        '0x0000000000000000000000000000000000000000',
                    previousEpochUpgradeCandidate:
                        '0x0000000000000000000000000000000000000000',
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
        clearTimeout(this.timeout)
    }

    getAllEventsForType = async (eventName) => {
        const { contract } = this.props
        return await contract.getPastEvents(eventName, {
            fromBlock: 0,
            toBlock: 'latest',
        })
    }

    ticker = async () => {
        const { web3, contract, token } = this.props
        console.log('vote', this.timeout)

        const eventInitialized = await this.getAllEventsForType('Initialized')
        const epochLength = eventInitialized.length
            ? eventInitialized[0].returnValues.epochLength
            : 300
        const currentEpoch = await contract.methods.currentEpoch().call()
        const reward = new BigNumber(REWARD_MULTIPLIER)
            .multipliedBy(new BigNumber(52 - currentEpoch))
            .toFixed()

        if (this.state.walletAddress) {
            const voterData = await getVoters(
                contract,
                this.state.walletAddress
            )

            if (voterData) {
                const eglBalance = await token.methods
                    .balanceOf(this.state.walletAddress)
                    .call()

                const voterData = await getVoters(
                    contract,
                    this.state.walletAddress
                )

                const lockupDate = voterData
                    ? new BigNumber(voterData.releaseDate)
                          .minus(
                              new BigNumber(epochLength).multipliedBy(
                                  voterData.lockupDuration
                              )
                          )
                          .toFixed()
                    : 0

                const currentAllowance = await allowance(
                    contract,
                    token,
                    this.state.walletAddress
                )

                const rewards = await calculateCumulativeRewards(
                    voterData.voteEpoch,
                    currentEpoch,
                    voterData.tokensLocked,
                    voterData.lockupDuration,
                    contract
                )
                const tokensUnlocked =
                    m().unix() > voterData.releaseDate
                        ? new BigNumber(voterData.tokensLocked)
                              .plus(
                                  new BigNumber(
                                      toWei(Number(rewards).toFixed(18))
                                  )
                              )
                              .toFixed(0)
                        : '0'

                const previousEpochDaoSum = await contract.methods
                    .previousEpochDaoSum()
                    .call()
                const previousEpochDaoCandidate = await contract.methods
                    .previousEpochDaoCandidate()
                    .call()
                const previousEpochUpgradeCandidate = await contract.methods
                    .previousEpochUpgradeCandidate()
                    .call()

                this.setState({
                    tokensLocked: voterData.tokensLocked,
                    releaseDate: voterData.releaseDate,
                    gasTarget: voterData.gasTarget,
                    lockupDuration: voterData.lockupDuration,
                    voterReward: rewards,
                    lockupDate: String(lockupDate),
                    eglBalance,
                    tokensUnlocked,
                    currentAllowance,
                    daoAmount: voterData.daoAmount,
                    daoRecipient: voterData.daoRecipient,
                    upgradeAddress: voterData.upgradeAddress,
                    previousEpochDaoSum,
                    previousEpochDaoCandidate,
                    previousEpochUpgradeCandidate,
                })
            }
        }

        const epochEndDate = m.unix(
            parseInt(await contract.methods.currentEpochStartDate().call()) +
                Number(epochLength)
        )
        const countdown = m.duration(+epochEndDate - +m())
        const baselineEgl = await getLatestGasLimit(web3)

        this.setState({
            timeToNextEpoch: countdown,
            baselineEgl,
            epochLength,
            totalEglReward: String(reward),
        })
    }

    handleConnectToWeb3 = () => connectToWeb3(window)

    render() {
        const {
            timeToNextEpoch,
            tokensLocked,
            releaseDate,
            gasTarget,
            lockupDuration,
            baselineEgl,
            totalEglReward,
            voterReward,
            lockupDate,
            eglBalance,
            walletAddress,
            tokensUnlocked,
            currentAllowance,
            epochLength,
            daoAmount,
            daoRecipient,
            upgradeAddress,
            previousEpochDaoSum,
            previousEpochDaoCandidate,
            previousEpochUpgradeCandidate,
        } = this.state
        const { contract, token } = this.props

        return (
            <GenericPageTemplate
                connectWeb3={this.handleConnectToWeb3}
                walletAddress={walletAddress}
                eglBalance={eglBalance ? eglBalance : '0'}
            >
                <div className={'flex flex-col bg-hailStorm'}>
                    <div className={'p-12 flex justify-center'}>
                        <div className={'w-4/5'}>
                            <div>
                                <h1
                                    className={
                                        'text-salmon text-6xl font-black'
                                    }
                                >
                                    VOTE
                                    <span className={'text-black'}>.</span>
                                </h1>
                                <div className={'w-32'}>
                                    <ArrowLink
                                        className={'ml-2 my-2'}
                                        title={'LEARN MORE'}
                                        color={'babyBlue'}
                                    />
                                </div>
                            </div>
                            <p className={'mt-8 text-left ml-16'}>
                                ⚠ Disclaimer: EGL was{' '}
                                <span className={'text-babyBlue underline'}>
                                    audited
                                </span>
                                . However, it is still experimental software.
                                Please use at your own risk.
                            </p>
                            <h3 className={'text-3xl mt-6 font-bold'}>
                                This week's vote
                            </h3>
                            <div
                                className={
                                    'flex items-start mt-20 justify-center'
                                }
                            >
                                <div className={'mr-8'}>
                                    <Countdown
                                        timeToNextEpoch={timeToNextEpoch}
                                        epochLength={Number(epochLength)}
                                    />
                                    <p className={'w-80 text-xs'}>
                                        Votes must be locked by Fridays at 2am
                                        UTC to participate.
                                    </p>
                                    <p className={'text-xs'}>
                                        The vote passes 6 hrs later on Fridays
                                        at 8pm UTC.
                                    </p>
                                </div>
                                <div>
                                    <NestedBox
                                        title={'EGLs to be awarded'}
                                        className={'bg-plum-dark'}
                                        nestedColor={'bg-plum'}
                                    >
                                        <p
                                            className={
                                                'font-extrabold text-3xl text-white'
                                            }
                                        >
                                            {Number(totalEglReward) > 0
                                                ? displayComma(
                                                      Math.round(totalEglReward)
                                                  )
                                                : 'ALL GONE !'}
                                        </p>
                                    </NestedBox>
                                </div>
                            </div>
                            <div
                                className={
                                    'flex items-start mt-8 justify-center flex-wrap'
                                }
                            >
                                <div className={'flex flex-col m-4'}>
                                    <NestedBox
                                        title={'Current gas limit'}
                                        className={''}
                                    >
                                        <p
                                            className={
                                                'font-extrabold text-3xl text-white'
                                            }
                                        >
                                            {baselineEgl
                                                ? displayComma(baselineEgl)
                                                : 'N/A'}
                                        </p>
                                    </NestedBox>
                                    <div className={'w-80'}>
                                        <p className={'text-xs text-left'}>
                                            {'Gas limit of last block mined'}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={
                                        'flex flex-col items-baseline m-4'
                                    }
                                >
                                    <NestedBox
                                        title={'DAO'}
                                        className={''}
                                        arrowLink={true}
                                        href={'/dao'}
                                    >
                                        <div
                                            className={
                                                'flex flex-col w-full h-full justify-center items-center text-white'
                                            }
                                        >
                                            {
                                                <div
                                                    className={
                                                        'flex justify-center w-full'
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            'flex flex-col w-1/2 justify-center'
                                                        }
                                                    >
                                                        <p
                                                            className={
                                                                'text-xs text-center my-1'
                                                            }
                                                        >
                                                            AMOUNT
                                                        </p>

                                                        <p
                                                            className={
                                                                'text-center'
                                                            }
                                                        >
                                                            {previousEpochDaoSum >
                                                            '0'
                                                                ? previousEpochDaoSum
                                                                : '-'}
                                                        </p>
                                                    </div>

                                                    <div
                                                        className={
                                                            'flex flex-col w-1/2 justify-center'
                                                        }
                                                    >
                                                        <p
                                                            className={
                                                                'text-xs text-center my-1'
                                                            }
                                                        >
                                                            ADDRESS
                                                        </p>
                                                        <p
                                                            className={
                                                                'text-center'
                                                            }
                                                        >
                                                            {previousEpochDaoCandidate !==
                                                            '0x0000000000000000000000000000000000000000'
                                                                ? truncateEthAddress(
                                                                      previousEpochDaoCandidate
                                                                  )
                                                                : '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    </NestedBox>
                                    <div className={'w-80'}>
                                        <p className={'text-xs text-left'}>
                                            <br />
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={
                                        'flex flex-col items-baseline m-4'
                                    }
                                >
                                    <NestedBox
                                        title={'Contract Upgrade'}
                                        className={''}
                                        arrowLink={true}
                                        href={'/about'}
                                    >
                                        <div
                                            className={
                                                'flex flex-col w-full h-full justify-center items-center text-white'
                                            }
                                        >
                                            <div
                                                className={
                                                    'flex flex-col w-full justify-center'
                                                }
                                            >
                                                <p
                                                    className={
                                                        'text-xs text-center my-1'
                                                    }
                                                >
                                                    ADDRESS
                                                </p>
                                                <p
                                                    style={{ height: '80%' }}
                                                    className={'text-center '}
                                                >
                                                    {previousEpochUpgradeCandidate !==
                                                    '0x0000000000000000000000000000000000000000'
                                                        ? truncateEthAddress(
                                                              previousEpochUpgradeCandidate
                                                          )
                                                        : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </NestedBox>
                                    <div className={'w-80'}>
                                        <p className={'text-xs text-left'}>
                                            <br />
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={'flex mt-16 w-full justify-center'}>
                                <SmartButton
                                    contract={contract}
                                    walletAddress={walletAddress}
                                    hasVoted={this.state.tokensLocked !== '0'}
                                    canWithdraw={
                                        this.state.tokensUnlocked !== '0'
                                    }
                                    openVoteModal={() =>
                                        this.setState({ voteClicked: true })
                                    }
                                    openRevoteModal={() =>
                                        this.setState({
                                            revoteClicked: true,
                                        })
                                    }
                                />
                                <Button
                                    className={'ml-8 w-40'}
                                    handleClick={() =>
                                        tallyVotes(
                                            this.props.contract,
                                            walletAddress
                                        )
                                    }
                                >
                                    <p>TALLY</p>
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className={'flex justify-center pb-8'}>
                        <div className={'w-4/5'}>
                            <h1
                                className={
                                    'mb-8  ml-8 text-3xl font-extrabold text-left'
                                }
                            >
                                Your vote
                            </h1>
                            <div className={'flex w-full ml-8'}>
                                <YourVoteTable
                                    tokensLocked={tokensLocked}
                                    releaseDate={releaseDate}
                                    gasTarget={gasTarget}
                                    lockupDuration={lockupDuration}
                                    voterReward={voterReward}
                                    lockupDate={lockupDate}
                                    daoAmount={daoAmount}
                                    daoRecipient={daoRecipient}
                                    upgradeAddress={upgradeAddress}
                                />
                            </div>
                            {tokensUnlocked != '0' && (
                                <div className={'flex flex-row ml-8'}>
                                    <WithdrawTable
                                        className={'mt-4'}
                                        tokensUnlocked={tokensUnlocked}
                                    />
                                    <div
                                        className={'flex items-end ml-4'}
                                    ></div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={'w-full flex justify-center'}>
                        <div className={'w-4/5'}>
                            <h1
                                className={
                                    'mt-8 ml-8 text-3xl font-extrabold text-left'
                                }
                            >
                                How to vote
                            </h1>
                            <div className={'mb-2'}>
                                <HowToVote />
                            </div>
                        </div>
                    </div>
                </div>
                {this.state.voteClicked && (
                    <VoteModal
                        contract={this.props.contract}
                        token={this.props.token}
                        walletAddress={walletAddress}
                        baselineEgl={baselineEgl}
                        eglBalance={eglBalance}
                        handleOutsideClick={() =>
                            this.setState({ voteClicked: false })
                        }
                    />
                )}
                {this.state.revoteClicked && (
                    <RevoteModal
                        contract={this.props.contract}
                        token={this.props.token}
                        walletAddress={walletAddress}
                        handleOutsideClick={() =>
                            this.setState({ revoteClicked: false })
                        }
                        releaseDate={releaseDate}
                        epochLength={epochLength}
                        tokensLocked={tokensLocked}
                        voterReward={voterReward}
                        baselineEgl={baselineEgl}
                    />
                )}
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
            <Vote
                accounts={accounts}
                contract={contract}
                web3={web3}
                token={token}
            />
        )}
    />
)
