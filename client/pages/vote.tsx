import React from 'react'
import GenericPageTemplate from '../components/pageTemplates/GenericPageTemplate'
import Web3Container from '../lib/Web3Container'
import connectToWeb3 from '../lib/connectToWeb3'
import HatBox from '../components/molecules/HatBox'
import Button from '../components/atoms/Button'
import VoteModal from '../components/organisms/VoteModal/VoteModal'
import RevoteModal from '../components/organisms/VoteModal/RevoteModal'
import {
    getVoters,
    getLatestGasLimit,
    withdraw,
    tallyVotes,
    increaseAllowance,
    allowance,
    calculateCumulativeRewards,
} from '../lib/contractMethods'
import StatusWidget from '../components/organisms/StatusWidget'
import { displayComma, fromWei } from '../lib/helpers'
import BigNumber from 'bignumber.js'
import m from 'moment'
import { REWARD_MULTIPLIER } from '../lib/constants'
import HowToVote from '../components/organisms/HowToVote'
import DaoWidget from '../components/organisms/DaoWidget'
import YourVoteTable from '../components/organisms/VoteTables/YourVoteTable'
import DaoTable from '../components/organisms/VoteTables/DaoTable'
import WithdrawTable from '../components/organisms/VoteTables/WithdrawTable'
import SmartButton from '../components/molecules/SmartButton'

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
        timeToNextEpoch: null,
        tokensLocked: '0',
        releaseDate: null,
        gasTarget: null,
        lockupDuration: null,
        baselineEgl: null,
        totalEglReward: null,
        voterReward: null,
        lockupDate: null,
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
                })
            } else {
                this.setState({
                    walletAddress: accounts[0],
                })
                this.timeout = setInterval(() => {
                    this.ticker()
                }, 1000)
            }
        })
        this.timeout = setInterval(() => {
            this.ticker()
        }, 1000)
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
        const { web3, contract, token } = this.props

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
                console.log(voterData)
                const lockupDate = voterData
                    ? new BigNumber(voterData.releaseDate)
                          .minus(
                              new BigNumber(epochLength).multipliedBy(
                                  voterData.lockupDuration
                              )
                          )
                          .toFixed()
                    : 0

                const tokensUnlocked =
                    m().unix() > voterData.releaseDate
                        ? voterData.tokensLocked
                        : '0'

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
                })
            }
        }

        const epochEndDate = m.unix(
            parseInt(await contract.methods.currentEpochStartDate().call()) +
                Number(epochLength)
        )
        const countdown = m.duration(+epochEndDate - +m())
        const nextEpoch =
            countdown.days() +
            ' days ' +
            countdown.hours() +
            ' hrs ' +
            countdown.minutes() +
            ' mins ' +
            countdown.seconds() +
            ' secs'
        const baselineEgl = await getLatestGasLimit(web3)

        this.setState({
            timeToNextEpoch: nextEpoch,
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
        } = this.state
        const { contract, token } = this.props

        return (
            <GenericPageTemplate
                connectWeb3={this.handleConnectToWeb3}
                walletAddress={walletAddress}
                eglBalance={eglBalance ? eglBalance : '0'}
            >
                <div className={'flex flex-col'}>
                    <div className={'bg-hailStorm p-12 flex justify-center'}>
                        <div className={'w-4/5'}>
                            <div>
                                <div>
                                    <h1
                                        className={
                                            'text-salmon text-4xl font-extrabold'
                                        }
                                    >
                                        VOTE
                                        <span className={'text-black'}>.</span>
                                    </h1>
                                    <h3 className={'text-2xl font-bold'}>
                                        This week's vote
                                    </h3>
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
                            <div className={'flex items-end ml-16 mt-8'}>
                                <div className={'flex flex-col mr-16'}>
                                    <h1
                                        className={
                                            'font-bold text-xl text-babyBlue m-4'
                                        }
                                    >
                                        REQUIRED
                                    </h1>
                                    <HatBox
                                        title={'CURRENT GAS LIMIT'}
                                        className={'bg-babyBlue w-96 mt-4'}
                                    >
                                        <p
                                            className={
                                                'font-extrabold text-4xl text-white'
                                            }
                                        >
                                            {baselineEgl
                                                ? displayComma(baselineEgl)
                                                : 'N/A'}
                                        </p>
                                    </HatBox>
                                    <div className={'w-96'}>
                                        <p className={'text-xs text-left'}>
                                            {'Gas limit of last block mined'}
                                        </p>
                                    </div>
                                </div>
                                <div className={'flex flex-col items-baseline'}>
                                    <h1
                                        className={'font-bold text-xl m-1 ml-4'}
                                    >
                                        OPTIONAL FIELDS
                                    </h1>
                                    <DaoWidget
                                        daoAmount={daoAmount}
                                        daoRecipient={daoRecipient}
                                        upgradeAddress={upgradeAddress}
                                    />
                                    <div className={'w-96'}>
                                        <p className={'text-xs text-left'}>
                                            <br />
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={'flex items-center mt-20 ml-16'}>
                                <div>
                                    <HatBox
                                        title={'NEXT VOTE CLOSING'}
                                        className={'bg-black mr-16 w-96'}
                                    >
                                        <p
                                            className={
                                                'font-extrabold text-2xl text-white text-center'
                                            }
                                        >
                                            {timeToNextEpoch
                                                ? timeToNextEpoch
                                                : 'N/A'}
                                        </p>
                                    </HatBox>
                                    <p className={'absolute w-96 text-xs'}>
                                        Votes must be locked by Fridays at 2am
                                        UTC to participate.
                                    </p>
                                    <p className={'absolute mt-4 text-xs'}>
                                        The vote passes 6 hrs later on Fridays
                                        at 8pm UTC.
                                    </p>
                                </div>

                                <HatBox
                                    title={'EGLs TO BE AWARDED'}
                                    className={'bg-black w-96'}
                                >
                                    <p
                                        className={
                                            'font-extrabold text-4xl text-white'
                                        }
                                    >
                                        {Number(totalEglReward) > 0
                                            ? displayComma(
                                                  Math.round(totalEglReward)
                                              )
                                            : 'ALL GONE !'}
                                    </p>
                                </HatBox>
                            </div>
                        </div>
                    </div>
                    <div className={'flex justify-center bg-hailStorm'}>
                        <div className={'w-4/5'}>
                            <h1
                                className={
                                    'm-8 mt-8 text-xl font-extrabold text-left'
                                }
                            >
                                Your Vote
                            </h1>
                            <div className={'flex w-full'}>
                                <YourVoteTable
                                    tokensLocked={tokensLocked}
                                    releaseDate={releaseDate}
                                    gasTarget={gasTarget}
                                    lockupDuration={lockupDuration}
                                    voterReward={voterReward}
                                    lockupDate={lockupDate}
                                />
                                <div className={'ml-4'}>
                                    <DaoTable
                                        daoAmount={daoAmount}
                                        daoRecipient={daoRecipient}
                                        upgradeAddress={upgradeAddress}
                                    />
                                </div>
                            </div>
                            <div className={'flex flex-row'}>
                                <WithdrawTable
                                    className={'mt-4'}
                                    tokensUnlocked={tokensUnlocked}
                                />
                                <div className={'flex items-end ml-4'}>
                                    <SmartButton
                                        contract={contract}
                                        token={token}
                                        walletAddress={walletAddress}
                                        noAllowance={
                                            this.state.currentAllowance === '0'
                                        }
                                        hasVoted={
                                            this.state.tokensLocked !== '0'
                                        }
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
                                </div>
                                <div className={'flex items-end ml-4'}>
                                    <Button
                                        className={'w-40'}
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

                            {/* <div className={'flex w-full ml-16 mt-4'}>
                                <StatusWidget
                                    contract={this.props.contract}
                                    token={this.props.token}
                                    walletAddress={walletAddress}
                                    tokensLocked={tokensLocked}
                                    releaseDate={releaseDate}
                                    gasTarget={gasTarget}
                                    lockupDuration={lockupDuration}
                                    voterReward={voterReward}
                                    lockupDate={lockupDate}
                                    tokensUnlocked={
                                        tokensUnlocked
                                            ? fromWei(String(tokensUnlocked))
                                            : '0'
                                    }
                                    noAllowance={
                                        this.state.currentAllowance === '0'
                                    }
                                    hasVoted={this.state.tokensLocked !== '0'}
                                    canWithdraw={
                                        this.state.tokensUnlocked !== '0'
                                    }
                                    openVoteModal={() =>
                                        this.setState({ voteClicked: true })
                                    }
                                    openRevoteModal={() =>
                                        this.setState({ revoteClicked: true })
                                    }
                                />
                            </div> */}
                            <div className={'flex justify-center w-full'}>
                                <div
                                    className={'flex justify-between mt-8'}
                                ></div>
                            </div>
                        </div>
                    </div>
                    <div className={'w-full flex justify-center'}>
                        <div className={'w-4/5'}>
                            <h1
                                className={
                                    'm-8 text-xl font-extrabold text-left'
                                }
                            >
                                How to Vote
                            </h1>
                            <div className={'p-4 mb-8 bg-hailStorm rounded-xl'}>
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
                // token={null}
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
