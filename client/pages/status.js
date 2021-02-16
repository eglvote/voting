import React from 'react'
import Web3Container from '../lib/Web3Container'
import moment from 'moment'
import BN from 'bn.js'
import GenericPageTemplate from '../components/pageTemplates/GenericPageTemplate'
import connectToWeb3 from '../lib/connectToWeb3'
import { getEglBalance } from '../lib/contractMethods'

const tableWidth1000 = {
    width: '100%',
}

const tableWidth50 = {
    width: '50%',
}

const thead = {
    backgroundColor: '#3d3d3d',
    fontWeight: 'bold',
    color: 'white',
}

const contractAttributeValue = {
    fontFamily: 'Courier New',
    fontSize: '10pt',
}

class EglContractStatus extends React.Component {
    state = {
        ethBalance: null,
        eglBalance: null,
        voterData: null,
    }

    formatBigNumberAttribute = (attribute) => {
        const { web3 } = this.props
        if (attribute === null || attribute === undefined) return attribute
        return parseFloat(web3.utils.fromWei(attribute)).toLocaleString(
            'en-US',
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 18,
            }
        )
    }

    getAllEventsForType = async (eventName) => {
        const { eglContract } = this.props
        return await eglContract.getPastEvents(eventName, {
            fromBlock: 0,
            toBlock: 'latest',
        })
    }

    refreshContractData = async () => {
        const { eglContract, web3, tokenContract } = this.props

        const eventInitialized = await this.getAllEventsForType("Initialized")
        const eventVotesTallied = await this.getAllEventsForType('VotesTallied')
        const eventCreatorRewardsClaimed = await this.getAllEventsForType(
            'CreatorRewardsClaimed'
        )
        const eventVote = await this.getAllEventsForType('Vote')
        const eventWithdraw = await this.getAllEventsForType('Withdraw')
        const eventSeedAccountFunded = await this.getAllEventsForType(
            'SeedAccountFunded'
        )
        const eventVoteThresholdMet = await this.getAllEventsForType(
            'VoteThresholdMet'
        )
        const eventVoteThresholdFailed = await this.getAllEventsForType(
            'VoteThresholdFailed'
        )
        const eventVoterRewardCalculated = await this.getAllEventsForType(
            'VoterRewardCalculated'
        )
        const eventEglsMatched = await this.getAllEventsForType('EglsMatched')
        const eventUniSwapLaunch = await this.getAllEventsForType(
            'UniSwapLaunch'
        )
        const eventEthReceived = await this.getAllEventsForType('EthReceived')
        const eventLiquidityTokensWithdrawn = await this.getAllEventsForType(
            'LiquidityTokensWithdrawn'
        )
        const eventPoolRewardsSwept = await this.getAllEventsForType(
            'PoolRewardsSwept'
        )
        const eventLiquidityAdded = await this.getAllEventsForType(
            'LiquidityAdded'
        )
        const eventCandidateVoteAdded = await this.getAllEventsForType(
            'CandidateVoteAdded'
        )
        const eventCandidateVoteRemoved = await this.getAllEventsForType(
            'CandidateVoteRemoved'
        )
        const eventCandidateVoteEvaluated = await this.getAllEventsForType(
            'CandidateVoteEvaluated'
        )

        const eglContractTokenBalance = await tokenContract.methods
            .balanceOf(eglContract._address)
            .call()

        const currentEpoch = await eglContract.methods.currentEpoch().call()
        const tokensInCirculation = await eglContract.methods
            .tokensInCirculation()
            .call()
        const currentEpochStartDate = moment.unix(
            await eglContract.methods.currentEpochStartDate().call()
        )
        const desiredEgl = await eglContract.methods.desiredEgl().call()

        const currentVoteWeightSum = await eglContract.methods
            .voteWeightsSum(0)
            .call()
        const currentVotesTotal = await eglContract.methods.votesTotal(0).call()

        const epochEndDate = moment.unix(
            parseInt(await eglContract.methods.currentEpochStartDate().call()) + 
            parseInt(eventInitialized[0].returnValues.epochLength)
        )
        const endEpochCountdown = moment.duration(epochEndDate - moment())

        const timeToNextEpoch =
            endEpochCountdown.days() +
            ' days ' +
            endEpochCountdown.hours() +
            ' hours ' +
            endEpochCountdown.minutes() +
            ' minutes ' +
            endEpochCountdown.seconds() +
            ' seconds'

        const voterRewardsSums = []
        for (let i = 0; i <= Math.min(currentEpoch, 51); i++) {
            voterRewardsSums.push(
                await eglContract.methods.voterRewardSums(i).call()
            )
        }

        const lpTokenReleaseDate = moment.unix(
            parseInt(eventInitialized[0].returnValues.firstEpochStartDate) + 
            parseInt(eventInitialized[0].returnValues.minLiquidityTokensLockup)
        )
        const lpTokenCountdown = moment.duration(lpTokenReleaseDate - moment())

        let timeToLPTokenRelease = lpTokenCountdown < 0 
            ? "0 days 0 hours 0 minutes 0 seconds" 
            : lpTokenCountdown.days() + " days " +
                lpTokenCountdown.hours() + " hours " +
                lpTokenCountdown.minutes() + " minutes " +
                lpTokenCountdown.seconds() + " seconds";
            
        let currentlyReleasedLPToken = lpTokenCountdown > 0 
            ? 0 
            : ((new Date().getTime() / 1000) - 
                parseInt(eventInitialized[0].returnValues.firstEpochStartDate) - 
                parseInt(eventInitialized[0].returnValues.minLiquidityTokensLockup)) * 
                750000000 /
                ((parseInt(eventInitialized[0].returnValues.epochLength) * 52) - parseInt(eventInitialized[0].returnValues.minLiquidityTokensLockup));

        const upcomingVotes = []
        for (let i = 1; i < 8; i++) {
            upcomingVotes.push({
                index: i,
                voteWeightSums: await eglContract.methods
                    .voteWeightsSum(i)
                    .call(),
                votesTotal: await eglContract.methods.votesTotal(i).call(),
            })
        }

        const eglBalance = await getEglBalance(
            tokenContract,
            this.props.accounts[0]
        )

        this.setState({
            currentTime: moment(),
            eglContractTokenBalance: eglContractTokenBalance,
            currentEpoch: parseInt(currentEpoch),
            currentEpochStartDate: currentEpochStartDate,
            timeToNextEpoch: timeToNextEpoch,
            tokensInCirculation: tokensInCirculation,
            currentVoteWeightSum: currentVoteWeightSum,
            currentVotesTotal: currentVotesTotal,
            desiredEgl: desiredEgl,
            upcomingVotes: upcomingVotes,
            voterRewardsSums: voterRewardsSums,
            currentlyReleasedLPToken: currentlyReleasedLPToken,
            timeToLPTokenRelease: timeToLPTokenRelease,
            eventSeedAccountFunded: eventSeedAccountFunded,
            eventVotesTallied: eventVotesTallied,
            eventCreatorRewardsClaimed: eventCreatorRewardsClaimed,
            eventVote: eventVote,
            eventWithdraw: eventWithdraw,
            eventVoteThresholdMet: eventVoteThresholdMet,
            eventVoteThresholdFailed: eventVoteThresholdFailed,
            eventVoterRewardCalculated: eventVoterRewardCalculated,
            eventEglsMatched: eventEglsMatched,
            eventUniSwapLaunch: eventUniSwapLaunch,
            eventEthReceived: eventEthReceived,
            eventLiquidityTokensWithdrawn: eventLiquidityTokensWithdrawn,
            eventInitialized: eventInitialized[0].returnValues,
            eventPoolRewardsSwept: eventPoolRewardsSwept,
            eventLiquidityAdded: eventLiquidityAdded,
            eventCandidateVoteAdded: eventCandidateVoteAdded,
            eventCandidateVoteRemoved: eventCandidateVoteRemoved,
            eventCandidateVoteEvaluated: eventCandidateVoteEvaluated,
            eglBalance,
        })
    }

    componentDidMount() {
        this.interval = setInterval(() => this.refreshContractData(), 1000)
    }

    componentWillUnmount() {
        clearInterval(this.interval)
    }

    render() {
        const {
            currentTime = moment(),
            eglContractTokenBalance = '-',
            currentEpoch = '-',
            currentEpochStartDate = moment(),
            timeToNextEpoch = '-',
            desiredEgl = '-',
            tokensInCirculation = '-',
            currentVoteWeightSum = '-',
            currentVotesTotal = '-',
            upcomingVotes = [],
            voterRewardsSums = [],
            timeToLPTokenRelease = "-",
            currentlyReleasedLPToken = 0,
            eventSeedAccountFunded = [],
            eventVotesTallied = [],
            eventCreatorRewardsClaimed = [],
            eventVote = [],
            eventWithdraw = [],
            eventVoteThresholdMet = [],
            eventVoteThresholdFailed = [],
            eventVoterRewardCalculated = [],
            eventEglsMatched = [],
            eventUniSwapLaunch = [],
            eventEthReceived = [],
            eventLiquidityTokensWithdrawn = [],
            eventInitialized = {},
            eventPoolRewardsSwept = [],
            eventLiquidityAdded = [],
            eventCandidateVoteAdded = [],
            eventCandidateVoteRemoved = [],
            eventCandidateVoteEvaluated = [],
            eglBalance = 0,
        } = this.state

        return (
            <GenericPageTemplate
                connectWeb3={() => connectToWeb3(window)}
                walletAddress={this.props.accounts[0]}
                eglBalance={eglBalance}
            >
                <div>
                    <h1>EGL Contract Status</h1>
                    <hr />

                    <div>
                        <div>
                            <b>Current Date: </b>
                            <span style={contractAttributeValue}>
                                {currentTime
                                    .local()
                                    .toDate()
                                    .toLocaleDateString()}{' '}
                                {currentTime
                                    .local()
                                    .toDate()
                                    .toLocaleTimeString()}
                            </span>
                        </div>
                        <br />
                        <table style={tableWidth1000}>
                            <tbody>
                                <tr>
                                    <td>
                                        <b>Current Epoch: </b>
                                        <span style={contractAttributeValue}>
                                            {currentEpoch}
                                        </span>
                                    </td>
                                    <td>
                                        <b>EGL Contract Token Balance: </b>
                                        <span style={contractAttributeValue}>
                                            {this.formatBigNumberAttribute(
                                                eglContractTokenBalance
                                            )}{' '}
                                            EGL{' '}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <b>Epoch Start Date: </b>
                                        <span style={contractAttributeValue}>
                                            {currentEpochStartDate
                                                .local()
                                                .toDate()
                                                .toString()}
                                        </span>
                                    </td>
                                    <td>
                                        <b>Tokens in Circulation: </b>
                                        <span style={contractAttributeValue}>
                                            {this.formatBigNumberAttribute(
                                                tokensInCirculation
                                            )}{' '}
                                            EGL
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <b>Time to Next Epoch: </b>
                                        <span style={contractAttributeValue}>
                                            {timeToNextEpoch}
                                        </span>
                                    </td>
                                    <td>
                                        <b>Current EGL: </b>
                                        <span style={contractAttributeValue}>
                                            {desiredEgl}
                                        </span>
                                    </td>
                                </tr>
                                <tr><td>&nbsp;</td></tr>
                                <tr>
                                    <td>
                                        <b>Time to LP Token Release: </b>
                                        <span style={contractAttributeValue}>{timeToLPTokenRelease}</span>
                                    </td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td>
                                        <b>Currently Released EGL Token: </b>
                                        <span style={contractAttributeValue}>{currentlyReleasedLPToken}</span>
                                    </td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <br />

                    <hr />
                    <div>
                        <table  style={tableWidth1000}>
                            <tbody>
                                <tr>
                                    <td colSpan="2"><h3>Addresses:</h3></td>
                                    <td colSpan="2"><h3>Deployment Params:</h3></td>
                                </tr>
                                <tr>
                                    <td><b>EGL Contract: </b></td>
                                    <td><span style={contractAttributeValue}>{eventInitialized.eglContract}</span></td>
                                    <td><b>Required ETH to Launch UniSwap: </b></td>
                                    <td><span style={contractAttributeValue}>{this.formatBigNumberAttribute(eventInitialized.ethRequiredToLaunchUniSwap)} ETH</span></td>
                                </tr>
                                <tr>
                                    <td><b>EGL Token: </b></td>
                                    <td><span style={contractAttributeValue}>{eventInitialized.eglToken}</span></td>
                                    <td><b>Liquidity Pool Lockup: </b></td>
                                    <td><span style={contractAttributeValue}>{eventInitialized.minLiquidityTokensLockup} seconds</span></td>
                                </tr>
                                <tr>
                                    <td><b>UniSwap Router: </b></td>
                                    <td><span style={contractAttributeValue}>{eventInitialized.uniSwapRouter}</span></td>
                                    <td><b>Voting Pause: </b></td>
                                    <td><span style={contractAttributeValue}>{eventInitialized.votingPauseSeconds} seconds before next epoch</span></td>
                                </tr>
                                <tr>
                                    <td><b>UniSwap Pair: </b></td>
                                    <td><span style={contractAttributeValue}>{eventInitialized.uniSwapPair}</span></td>
                                    <td><b>Epoch Length: </b></td>
                                    <td><span style={contractAttributeValue}>{eventInitialized.epochLength} seconds</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <br />

                    <hr />
                    <div>
                        <h3>Seed Accounts:</h3>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                <td>Date</td>
                                <td>Time</td>
                                <td>Seed Account</td>
                                <td>Total Seed Amount</td>
                                <td>Seed Amount per Account</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventSeedAccountFunded.map((event) => {
                                return (
                                    <tr>
                                    <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleDateString()}</td>
                                    <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleTimeString()}</td>
                                    <td>{event.returnValues.seedAddress}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.initialSeedAmount)}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.individualSeedAmount)}</td>
                                    </tr>
                                )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <br />

                    <hr />
                    <br />
                    <div>
                        <b>Current Epoch Votes:</b>
                    </div>
                    <div>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Epoch</td>
                                    <td>Total Vote Weight</td>
                                    <td>Total Locked Tokens</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                <tr>
                                    <td>{currentEpoch}</td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            currentVoteWeightSum
                                        )}
                                    </td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            currentVotesTotal
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <br />

                    <br />
                    <div>
                        <b>Upcoming Votes:</b>
                    </div>
                    <div>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Epoch</td>
                                    <td>Total Vote Weight</td>
                                    <td>Total Locked Tokens</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {upcomingVotes.map((upcomingVote) => {
                                    return (
                                        <tr>
                                            <td>
                                                {currentEpoch +
                                                    upcomingVote.index}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    upcomingVote.voteWeightSums
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    upcomingVote.votesTotal
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <br />

                    <br />
                    <div>
                        <b>Vote Totals Per Epoch: </b>
                        <table style={tableWidth50}>
                            <thead style={thead}>
                                <tr>
                                    <td>Epoch</td>
                                    <td>Votes Total</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {voterRewardsSums.map((epochReward, idx) => {
                                    return (
                                        <tr>
                                            <td>{idx}</td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    epochReward
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <br />

                    <hr />
                    <h2>Events</h2>
                    <div>
                        <b>Votes:</b>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Date</td>
                                    <td>Time</td>
                                    <td>Voter</td>
                                    <td>Current Epoch</td>
                                    <td>Gas Target</td>
                                    <td>EGL Amount</td>
                                    <td>Lockup Duration</td>
                                    <td>Vote Weight</td>
                                    <td>Release Date</td>
                                    <td>Total Votes</td>
                                    <td>Total Votes (for reward)</td>
                                    <td>Total Locked Tokens</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventVote.map((event) => {
                                    return (
                                        <tr>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleDateString()}
                                            </td>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleTimeString()}
                                            </td>
                                            <td>{event.returnValues.caller}</td>
                                            <td>
                                                {
                                                    event.returnValues
                                                        .currentEpoch
                                                }
                                            </td>
                                            <td>
                                                {event.returnValues.gasTarget}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues.eglAmount
                                                )}
                                            </td>
                                            <td>
                                                {
                                                    event.returnValues
                                                        .lockupDuration
                                                }
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    new BN(
                                                        event.returnValues.eglAmount
                                                    )
                                                        .mul(
                                                            new BN(
                                                                event.returnValues.lockupDuration
                                                            )
                                                        )
                                                        .toString()
                                                )}
                                            </td>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues
                                                            .releaseDate
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleDateString() +
                                                    ' ' +
                                                    moment
                                                        .unix(
                                                            event.returnValues
                                                                .releaseDate
                                                        )
                                                        .local()
                                                        .toDate()
                                                        .toLocaleTimeString()}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .epochVoteWeightSum
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .epochVoterRewardSum
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .epochTotalVotes
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    <br />
                    <div>
                        <b>DAO/Upgrade Candidate Vote Added:</b>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Date</td>
                                    <td>Time</td>
                                    <td>Type</td>
                                    <td>Candidate Address</td>
                                    <td>Current Epoch</td>
                                    <td>Vote Weight</td>
                                    <td>DAO Amount Sum</td>
                                    <td>Idx</td>
                                    <td>Total Number of Candidates</td>
                                    <td>Candidate Dropped</td>
                                    <td>Candidate Dropped Vote Weight</td>
                                    <td>Candidate Dropped Idx</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventCandidateVoteAdded.map((event) => {
                                    return (
                                        <tr>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleDateString()}
                                            </td>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleTimeString()}
                                            </td>
                                            <td>{ event.returnValues.candidateAmountSum == 0 ? 'Upgrade' : 'DAO' }</td>                                            
                                            <td>{ event.returnValues.candidate }</td>
                                            <td>{ event.returnValues.currentEpoch }</td>
                                            <td>{ this.formatBigNumberAttribute(event.returnValues.candidateVoteCount) }</td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues.candidateAmountSum
                                                )}
                                            </td>
                                            <td>
                                                { event.returnValues.candidateIdx }
                                            </td>
                                            <td>
                                                { event.returnValues.numberOfCandidates }
                                            </td>
                                            <td>
                                                {event.returnValues.losingCandidate}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .losingCandidateEgls
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .losingCandidateIdx
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    <br />
                    <div>
                        <b>DAO/Upgrade Candidate Vote Removed:</b>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Date</td>
                                    <td>Time</td>
                                    <td>Type</td>
                                    <td>Candidate Address</td>
                                    <td>Current Epoch</td>
                                    <td>Vote Weight</td>
                                    <td>DAO Amount Sum</td>
                                    <td>Idx</td>
                                    <td>Total Number of Candidates</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventCandidateVoteRemoved.map((event) => {
                                    return (
                                        <tr>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleDateString()}
                                            </td>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleTimeString()}
                                            </td>
                                            <td>{ event.returnValues.candidateAmountSum == 0 ? 'Upgrade' : 'DAO' }</td>
                                            <td>{ event.returnValues.candidate }</td>
                                            <td>{ event.returnValues.currentEpoch }</td>
                                            <td>{ this.formatBigNumberAttribute(event.returnValues.candidateVoteCount) }</td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues.candidateAmountSum
                                                )}
                                            </td>
                                            <td>
                                                { event.returnValues.candidateIdx }
                                            </td>
                                            <td>
                                                { event.returnValues.numberOfCandidates }
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    <br />

                    <br />
                    <div>
                        <b>Withdraw:</b>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Date</td>
                                    <td>Time</td>
                                    <td>Caller</td>
                                    <td>Current Epoch</td>
                                    <td>Original Vote</td>
                                    <td>Tokens Locked</td>
                                    <td>Reward Tokens</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventWithdraw.map((event) => {
                                    return (
                                        <tr>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleDateString()}
                                            </td>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleTimeString()}
                                            </td>
                                            <td>{event.returnValues.caller}</td>
                                            <td>
                                                {
                                                    event.returnValues
                                                        .currentEpoch
                                                }
                                            </td>
                                            <td>
                                                {event.returnValues.gasTarget}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .tokensLocked
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .rewardTokens
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    <br />
                    <div>
                        <b>VoterReward Calculation:</b>
                        <div>
                            Voter Rewards = (Vote Weight / Epoch Total Votes) *
                            Reward Multiplier
                        </div>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Date</td>
                                    <td>Time</td>
                                    <td>Voter</td>
                                    <td>Current Epoch</td>
                                    <td>Reward Epoch</td>
                                    <td>Cumulative Reward</td>
                                    <td>Reward per Epoch</td>
                                    <td>Vote Weight</td>
                                    <td>Epoch Total Votes</td>
                                    <td>Reward Multiplier</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventVoterRewardCalculated.map((event) => {
                                    return (
                                        <tr>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleDateString()}
                                            </td>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleTimeString()}
                                            </td>
                                            <td>{event.returnValues.voter}</td>
                                            <td>
                                                {
                                                    event.returnValues
                                                        .currentEpoch
                                                }
                                            </td>
                                            <td>
                                                {52 -
                                                    event.returnValues.weeksDiv}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .voterReward
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .epochVoterReward
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .voteWeight
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .epochVoterRewardSum
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    new BN(
                                                        event.returnValues.rewardMultiplier
                                                    ).mul(
                                                        new BN(
                                                            event.returnValues.weeksDiv
                                                        )
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <br />

                    <hr />
                    <br />
                    <div>
                        <b>Tally Votes:</b>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Date</td>
                                    <td>Time</td>
                                    <td>Caller</td>
                                    <td>Current Epoch</td>
                                    <td>Desired EGL</td>
                                    <td>EGL Vote %</td>
                                    <td>DAO Vote %</td>
                                    <td>Upgrade Vote %</td>
                                    <td>Average Gas Target</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventVotesTallied.map((event) => {
                                    return (
                                        <tr>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleDateString()}
                                            </td>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleTimeString()}
                                            </td>
                                            <td>{event.returnValues.caller}</td>
                                            <td>
                                                {
                                                    event.returnValues
                                                        .currentEpoch
                                                }
                                            </td>
                                            <td>
                                                {event.returnValues.desiredEgl}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .actualVotePercentage
                                                )}
                                                %
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .daoVotePercentage
                                                )}
                                                %
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .upgradeVotePercentage
                                                )}
                                                %
                                            </td>
                                            <td>
                                                {
                                                    event.returnValues
                                                        .averageGasTarget
                                                }
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    <br />
                    <div>
                        <b>Vote Threshold Met:</b>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Date</td>
                                    <td>Time</td>
                                    <td>Caller</td>
                                    <td>Current Epoch</td>
                                    <td>New EGL</td>
                                    <td>Vote Threshold Percentage</td>
                                    <td>Actual Vote Percentage</td>
                                    <td>Gas Limit Sum</td>
                                    <td>Blocks Considered</td>
                                    <td>Baseline EGL</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventVoteThresholdMet.map((event) => {
                                    return (
                                        <tr>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleDateString()}
                                            </td>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleTimeString()}
                                            </td>
                                            <td>{event.returnValues.caller}</td>
                                            <td>
                                                {
                                                    event.returnValues
                                                        .currentEpoch
                                                }
                                            </td>
                                            <td>
                                                {event.returnValues.desiredEgl}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .voteThreshold
                                                )}
                                                %
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .actualVotePercentage
                                                )}
                                                %
                                            </td>
                                            <td>
                                                {event.returnValues.gasLimitSum}
                                            </td>
                                            <td>
                                                {event.returnValues.voteCount}
                                            </td>
                                            <td>
                                                {event.returnValues.baselineEgl}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    <br />
                    <div>
                        <b>Vote Threshold Failed:</b>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Date</td>
                                    <td>Time</td>
                                    <td>Caller</td>
                                    <td>Current Epoch</td>
                                    <td>New EGL</td>
                                    <td>Initial EGL</td>
                                    <td>Baseline EGL</td>
                                    <td>Vote Threshold Percentage</td>
                                    <td>Actual Vote Percentage</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventVoteThresholdFailed.map((event) => {
                                    return (
                                        <tr>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleDateString()}
                                            </td>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleTimeString()}
                                            </td>
                                            <td>{event.returnValues.caller}</td>
                                            <td>
                                                {
                                                    event.returnValues
                                                        .currentEpoch
                                                }
                                            </td>
                                            <td>
                                                {event.returnValues.desiredEgl}
                                            </td>
                                            <td>
                                                {event.returnValues.initialEgl}
                                            </td>
                                            <td>
                                                {event.returnValues.baselineEgl}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .voteThreshold
                                                )}
                                                %
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .actualVotePercentage
                                                )}
                                                %
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    <br />
                    <div>
                        <b>DAO/Upgrade Candidate Vote Evaluated:</b>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Date</td>
                                    <td>Time</td>
                                    <td>Type</td>
                                    <td>Winner Address</td>
                                    <td>Current Epoch</td>
                                    <td>Winner Votes</td>
                                    <td>Winner Amount</td>
                                    <td>Total Vote Weight</td>
                                    <td>Total Vote Percentage</td>
                                    <td>Threshold Passed</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventCandidateVoteEvaluated.map((event) => {
                                    return (
                                        <tr>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleDateString()}
                                            </td>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleTimeString()}
                                            </td>
                                            <td>{event.returnValues.winnerAmount == 0 ? 'Upgrade' : 'DAO'}</td>
                                            <td>{event.returnValues.winner}</td>
                                            <td>
                                                {
                                                    event.returnValues
                                                        .currentEpoch
                                                }
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(event.returnValues.winnerVotes) }
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(event.returnValues.winnerAmount)}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(event.returnValues.totalVoteWeight)}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .totalVotePercentage
                                                )}
                                                %
                                            </td>
                                            <td>
                                                { event.returnValues.thresholdPassed.toString()}                                                
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <br />

                    <hr />
                    <br />
                    <div>
                        <b>Creator Rewards Claimed:</b>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Date</td>
                                    <td>Time</td>
                                    <td>Caller</td>
                                    <td>Creator Address</td>
                                    <td>Current Epoch</td>
                                    <td>Reward Amount</td>
                                    <td>Remaining Reward Amount</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventCreatorRewardsClaimed.map((event) => {
                                    return (
                                        <tr>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleDateString()}
                                            </td>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleTimeString()}
                                            </td>
                                            <td>{event.returnValues.caller}</td>
                                            <td>
                                                {
                                                    event.returnValues
                                                        .creatorRewardAddress
                                                }
                                            </td>
                                            <td>
                                                {
                                                    event.returnValues
                                                        .currentEpoch
                                                }
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .amountClaimed
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .remainingCreatorReward
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <br />

                    <hr />
                    <div>
                        <b>Pool Rewards Swept:</b>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Block Number</td>
                                    <td>Caller</td>
                                    <td>Block Gas Limit</td>
                                    <td>Difference From EGL</td>
                                    <td>Reward Percentage</td>
                                    <td>Calculated Reward Amount</td>
                                    <td>Reward Amount Transferred</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventPoolRewardsSwept.map((event) => {
                                    return (
                                        <tr>
                                            <td>{event.returnValues.blockNumber}</td>
                                            <td>{event.returnValues.caller}</td>
                                            <td>
                                                {
                                                    event.returnValues
                                                        .blockGasLimit
                                                }
                                            </td>
                                            <td>
                                                {
                                                    event.returnValues
                                                        .difference
                                                }
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .rewardPercentage
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .blockReward
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .actualAmountTransferred
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <br />

                    <hr />
                    <div>
                        <b>Uniswap - EGL's Matched:</b>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Date</td>
                                    <td>Time</td>
                                    <td>Caller</td>
                                    <td>UniSwap Launched</td>
                                    <td>ETH:EGL Ratio</td>
                                    <td>Eth Received</td>
                                    <td>Total ETH Received</td>
                                    <td>EGLs Matched</td>
                                    <td>Total EGL's Matched</td>
                                    <td>Pool Tokens Received</td>
                                    <td>Total Pool Tokens</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventEglsMatched.map((event) => {
                                    return (
                                        <tr>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleDateString()}
                                            </td>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleTimeString()}
                                            </td>
                                            <td>{event.returnValues.caller}</td>
                                            <td>
                                                {event.returnValues.uniSwapLaunched.toString()}
                                            </td>
                                            <td>
                                                1:
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .ethEglRatio
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .amountReceived
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .ethToBeDeployed
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .eglsToBeMatched
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .eglsMatched
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .poolTokensReceived
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .poolTokensHeld
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <br />
                    <div>
                        <b>Uniswap - Added Liquidity:</b>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Date</td>
                                    <td>Time</td>
                                    <td>Caller</td>
                                    <td>Desired EGL's</td>
                                    <td>ETH Amount</td>
                                    <td>Minimum EGL's</td>
                                    <td>Minimum ETH amount</td>
                                    <td>Pool Tokens Received</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventLiquidityAdded.map((event) => {
                                    return (
                                        <tr>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleDateString()}
                                            </td>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleTimeString()}
                                            </td>
                                            <td>{event.returnValues.caller}</td>
                                            <td>
                                                1:
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .desiredTokenAmount
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .ethAmount
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .minTokenAmount
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .minEthAmount
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .poolTokensReceived
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <br />
                    <div>
                        <b>Uniswap - Launched:</b>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Date</td>
                                    <td>Time</td>
                                    <td>Caller</td>
                                    <td>ETH:EGL Ratio</td>
                                    <td>Deployed Using (ETH)</td>
                                    <td>EGLs Matched</td>
                                    <td>Expected Liquidity Tokens</td>
                                    <td>Actual Liquidity Tokens</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventUniSwapLaunch.map((event) => {
                                    return (
                                        <tr>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleDateString()}
                                            </td>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleTimeString()}
                                            </td>
                                            <td>{event.returnValues.caller}</td>
                                            <td>
                                                1:
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .ethEglRatio
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .ethToBeDeployed
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .eglsMatched
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .poolTokensHeld
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .poolTokensReceived
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    <br />
                    <div>
                        <b>Uniswap - Liquidity Tokens Withdrawn:</b>
                        <table style={tableWidth1000}>
                            <thead style={thead}>
                                <tr>
                                    <td>Date</td>
                                    <td>Time</td>
                                    <td>Caller</td>
                                    <td>Current Egl Released</td>
                                    <td>Liquidity Tokens Due</td>
                                    <td>Remaining Liquidity Tokens</td>
                                    <td>First EGL</td>
                                    <td>Last EGL</td>
                                </tr>
                            </thead>
                            <tbody style={contractAttributeValue}>
                                {eventLiquidityTokensWithdrawn.map((event) => {
                                    return (
                                        <tr>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleDateString()}
                                            </td>
                                            <td>
                                                {moment
                                                    .unix(
                                                        event.returnValues.date
                                                    )
                                                    .local()
                                                    .toDate()
                                                    .toLocaleTimeString()}
                                            </td>
                                            <td>{event.returnValues.caller}</td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .currentEglReleased
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .poolTokensDue
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues
                                                        .poolTokens
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues.firstEgl
                                                )}
                                            </td>
                                            <td>
                                                {this.formatBigNumberAttribute(
                                                    event.returnValues.lastEgl
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
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
                token={null}
            >
                <div
                    style={{ animation: `fadeIn 1s` }}
                    className="opacity-25 fixed inset-0 z-30 bg-black"
                />
            </GenericPageTemplate>
        )}
        render={({ web3, accounts, contract, token }) => (
            <EglContractStatus
                accounts={accounts}
                eglContract={contract}
                web3={web3}
                tokenContract={token}
            />
        )}
    />
)
