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
} from '../lib/contractMethods'
import StatusWidget from '../components/organisms/StatusWidget'
import {
    displayComma,
    calculateIndividualReward,
    fromWei,
} from '../lib/helpers'
// import BN from 'bn.js'
import BigNumber from 'bignumber.js'
import m from 'moment'
import { REWARD_MULTIPLIER } from '../lib/constants'

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
        tokensLocked: null,
        releaseDate: null,
        gasTarget: null,
        lockupDuration: null,
        baselineEgl: null,
        totalEglReward: null,
        voterReward: null,
        lockupDate: null,
        eglBalance: null,
        walletAddress: this.props.accounts ? this.props.accounts[0] : null,
        voteClicked: false,
        revoteClicked: false,
        tokensUnlocked: 0,
        currentAllowance: 0,
        epochLength: '300',
    }

    timeout = null

    componentWillMount() {
        this.state.walletAddress && this.ticker()

        window.ethereum.on('accountsChanged', (accounts) => {
            if (!accounts.length) {
                this.setState({
                    timeToNextEpoch: null,
                    tokensLocked: null,
                    releaseDate: null,
                    gasTarget: null,
                    lockupDuration: null,
                    baselineEgl: null,
                    totalEglReward: null,
                    voterReward: null,
                    lockupDate: null,
                    eglBalance: 0,
                    walletAddress: null,
                    voteClicked: false,
                    revoteClicked: false,
                    tokensUnlocked: 0,
                    currentAllowance: 0,
                })
                clearInterval(this.timeout)
            } else {
                this.setState({
                    walletAddress: accounts[0],
                })
                this.timeout = setInterval(() => {
                    this.state.walletAddress && this.ticker()
                }, 1000)
            }
        })
        this.timeout = setInterval(() => {
            this.state.walletAddress && this.ticker()
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
        const { web3, accounts, contract, token } = this.props
        if (!this.state.walletAddress) return

        const eventInitialized = await this.getAllEventsForType('Initialized')
        const epochLength = eventInitialized[0].returnValues.epochLength
        // console.log(epochLength)
        const eglBalance = await token.methods
            .balanceOf(this.state.walletAddress)
            .call()
        const epochEndDate = m.unix(
            parseInt(await contract.methods.currentEpochStartDate().call()) +
                300
        )
        const countdown = m.duration(+epochEndDate - +m())
        const nextEpoch =
            countdown.days() +
            ' days ' +
            countdown.hours() +
            ' hours ' +
            countdown.minutes() +
            ' minutes ' +
            countdown.seconds() +
            ' seconds'
        const voterData = await getVoters(contract, this.state.walletAddress)
        const baselineEgl = await getLatestGasLimit(web3)
        const currentEpoch = await contract.methods.currentEpoch().call()
        const voteWeightsSum = await contract.methods.voteWeightsSum(0).call()
        const reward = new BigNumber(REWARD_MULTIPLIER)
            .multipliedBy(new BigNumber(52 - currentEpoch))
            .toFixed()

        const lockupDate = voterData
            ? new BigNumber(voterData.releaseDate)
                  .minus(
                      new BigNumber(epochLength).multipliedBy(
                          voterData.lockupDuration
                      )
                  )
                  .toFixed()
            : 0

        // Voter Rewards = (Vote Weight / Epoch Total Votes) * Reward Multiplier * Reward Weeks
        const individualReward = calculateIndividualReward(
            voterData.tokensLocked,
            voterData.lockupDuration,
            voteWeightsSum.toString(),
            reward.toString()
        )

        const tokensUnlocked =
            m().unix() > voterData.releaseDate ? voterData.tokensLocked : 0

        const currentAllowance = await allowance(
            contract,
            token,
            this.state.walletAddress
        )

        this.setState({
            timeToNextEpoch: nextEpoch,
            tokensLocked: voterData.tokensLocked,
            releaseDate: voterData.releaseDate,
            gasTarget: voterData.gasTarget,
            lockupDuration: voterData.lockupDuration,
            baselineEgl,
            totalEglReward: String(reward),
            voterReward: individualReward,
            lockupDate: String(lockupDate),
            eglBalance,
            tokensUnlocked,
            currentAllowance,
            epochLength,
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
        } = this.state
        return (
            <GenericPageTemplate
                connectWeb3={this.handleConnectToWeb3}
                walletAddress={walletAddress}
                eglBalance={eglBalance ? eglBalance : 0}
            >
                <div className={'p-12 h-screen'}>
                    <h1 className={'text-salmon text-4xl font-extrabold'}>
                        VOTE<span className={'text-black'}>.</span>
                    </h1>
                    <h3 className={'text-2xl font-bold'}>This weeks vote</h3>
                    <p className={'mt-8 text-center'}>
                        ⚠ Disclaimer: EGL was{' '}
                        <span className={'text-babyBlue underline'}>
                            audited
                        </span>
                        . However, it is still experimental software. Please use
                        at your own risk.
                    </p>
                    <div className={'flex justify-center items-center mt-12'}>
                        <HatBox
                            title={'CURRENT GAS LIMIT'}
                            className={'bg-babyBlue w-96'}
                        >
                            <p className={'font-extrabold text-4xl text-white'}>
                                {baselineEgl
                                    ? displayComma(baselineEgl)
                                    : 'N/A'}
                            </p>
                        </HatBox>
                    </div>
                    <div className={'flex justify-center items-center mt-20'}>
                        <HatBox
                            title={'NEXT VOTE CLOSING'}
                            className={'bg-black mr-20 w-96'}
                        >
                            <p
                                className={
                                    'font-extrabold text-2xl text-white text-center'
                                }
                            >
                                {timeToNextEpoch ? timeToNextEpoch : 'N/A'}
                            </p>
                        </HatBox>
                        <HatBox
                            title={'EGLs TO BE REWARDED'}
                            className={'bg-black w-96'}
                        >
                            <p className={'font-extrabold text-4xl text-white'}>
                                {Number(totalEglReward) > 0
                                    ? displayComma(totalEglReward)
                                    : 'ALL GONE !'}
                            </p>
                        </HatBox>
                    </div>
                    <div className={'flex justify-center w-full mt-4'}>
                        <StatusWidget
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
                        />
                    </div>
                    <div className={'w-full'}>
                        <div className={'w-1/2 text-center'}>
                            Allowance: {displayComma(fromWei(currentAllowance))}
                        </div>
                    </div>

                    <div className={'flex justify-center w-full'}>
                        <div className={'flex justify-between mt-8'}>
                            <Button
                                className={'w-40 m-4'}
                                handleClick={() =>
                                    increaseAllowance(
                                        this.props.contract,
                                        this.props.token,
                                        walletAddress
                                    )
                                }
                            >
                                <p>+ALLOWANCE</p>
                            </Button>
                            <Button
                                className={'w-40 m-4'}
                                handleClick={() =>
                                    this.setState({ voteClicked: true })
                                }
                            >
                                <p>VOTE</p>
                            </Button>
                            <Button
                                className={'w-40 m-4'}
                                handleClick={() =>
                                    this.setState({ revoteClicked: true })
                                }
                            >
                                <p>RE-VOTE</p>
                            </Button>
                            <Button
                                className={'w-40 m-4'}
                                handleClick={() =>
                                    withdraw(this.props.contract, walletAddress)
                                }
                            >
                                <p>WITHDRAW</p>
                            </Button>
                            <Button
                                className={'w-40 m-4'}
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
                {this.state.voteClicked && (
                    <VoteModal
                        // web3Reader={web3Reader}
                        contract={this.props.contract}
                        token={this.props.token}
                        walletAddress={walletAddress}
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
