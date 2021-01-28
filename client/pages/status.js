import React from 'react'
import Web3Container from '../lib/Web3Container'
import Link from 'next/link'
import moment from 'moment'
import BN from 'bn.js'

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
        const {web3} = this.props
        if (attribute === null || attribute === undefined) return attribute;
        return parseFloat(web3.utils.fromWei(attribute)).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 18,
        })
    }

    getAllEventsForType = async (eventName) => {
        const {eglContract} = this.props
        return await eglContract.getPastEvents(eventName, {
            fromBlock: 0,
            toBlock: 'latest',
        })
    }

    refreshContractData = async () => {
        const {eglContract, web3, tokenContract} = this.props

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

        const currentVoteWeightSum = await eglContract.methods.voteWeightsSum(0).call()
        const currentVotesTotal = await eglContract.methods.votesTotal(0).call()

        const epochEndDate = moment.unix(
            parseInt(await eglContract.methods.currentEpochStartDate().call()) + 300
        )
        const countdown = moment.duration(epochEndDate - moment())

        const timeToNextEpoch =
            countdown.days() +
            ' days ' +
            countdown.hours() +
            ' hours ' +
            countdown.minutes() +
            ' minutes ' +
            countdown.seconds() +
            ' seconds'

        const voterRewardsSums = []
        for (let i = 0; i <= currentEpoch; i++) {
            voterRewardsSums.push(await eglContract.methods.voterRewardSums(i).call())
        }

        const eventVotesTallied = await this.getAllEventsForType('VotesTallied')
        const eventCreatorRewardsClaimed = await this.getAllEventsForType(
            'CreatorRewardsClaimed'
        )
        const eventVote = await this.getAllEventsForType('Vote')
        const eventWithdraw = await this.getAllEventsForType('Withdraw')
        const eventSeedAccountsFunded = await this.getAllEventsForType(
            'SeedAccountsFunded'
        )
        const eventVoteThresholdMet = await this.getAllEventsForType(
            'VoteThresholdMet'
        )
        const eventVoteThresholdFailed = await this.getAllEventsForType(
            'VoteThresholdFailed'
        )
        const eventVoterRewardCalculated = await this.getAllEventsForType('VoterRewardCalculated')
        const eventEglsMatched = await this.getAllEventsForType('EglsMatched')
        const eventUniSwapLaunch = await this.getAllEventsForType('UniSwapLaunch')
        const eventEthReceived = await this.getAllEventsForType('EthReceived')
        const eventLiquidityTokensWithdrawn = await this.getAllEventsForType('LiquidityTokensWithdrawn')
        const eventInitialized = await this.getAllEventsForType('Initialized')

        const upcomingVotes = []
        for (let i = 1; i < 8; i++) {
            upcomingVotes.push({
                index: i,
                voteWeightSums: await eglContract.methods.voteWeightsSum(i).call(),
                votesTotal: await eglContract.methods.votesTotal(i).call(),
            })
        }

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
            eventSeedAccountsFunded: eventSeedAccountsFunded,
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
            eventInitialized: eventInitialized,
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
            eventSeedAccountsFunded = [],
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
            eventInitialized = [],
        } = this.state

        return (
            <div>
                <h1>EGL Contract Status</h1>
                <div>
                    <Link href="/dapp">
                        <a>Dapp</a>
                    </Link>
                </div>
                <div>
                    <Link href="/accounts">
                        <a>My Accounts</a>
                    </Link>
                </div>
                <div>
                    <Link href="/">
                        <a>Home</a>
                    </Link>
                </div>
                <hr/>

                <div>
                    <div>
                        <b>Current Date: </b>
                        <span style={contractAttributeValue}>
              {currentTime.local().toDate().toLocaleDateString()}{' '}
                            {currentTime.local().toDate().toLocaleTimeString()}
            </span>
                    </div>
                    <br/>
                    <table style={tableWidth1000}>
                        <tbody>
                        <tr>
                            <td>
                                <b>Current Epoch: </b>
                                <span style={contractAttributeValue}>{currentEpoch}</span>
                            </td>
                            <td>
                                <b>EGL Contract Token Balance: </b>
                                <span style={contractAttributeValue}>
                    {this.formatBigNumberAttribute(eglContractTokenBalance)} EGL{' '}
                  </span>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <b>Epoch Start Date: </b>
                                <span style={contractAttributeValue}>
                    {currentEpochStartDate.local().toDate().toString()}
                  </span>
                            </td>
                            <td>
                                <b>Tokens in Circulation: </b>
                                <span style={contractAttributeValue}>
                    {this.formatBigNumberAttribute(tokensInCirculation)} EGL
                  </span>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <b>Time to Next Epoch: </b>
                                <span style={contractAttributeValue}>{timeToNextEpoch}</span>
                            </td>
                            <td>
                                <b>Current EGL: </b>
                                <span style={contractAttributeValue}>{desiredEgl}</span>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <br/>

                <hr />
                <div>
                 <h3>Addresses:</h3>
                 <table style={tableWidth1000}>
                   <thead style={thead}>
                     <tr>
                       <td>EGL Contract Address</td>                       
                       <td>EGL Token Address</td>
                       <td>UniSwap Router Address</td>
                       <td>UniSwap Pair Address</td>
                     </tr>
                   </thead>
                   <tbody style={contractAttributeValue}>
                     {eventInitialized.map((event) => {
                        return (
                          <tr>
                            <td>{event.returnValues.eglContract}</td>
                            <td>{event.returnValues.eglToken}</td>
                            <td>{event.returnValues.uniSwapRouter}</td>
                            <td>{event.returnValues.uniSwapPair}</td>
                          </tr>
                        )
                      })}
                   </tbody>
                 </table>
                </div>
                <br />
                <div>
                 <h3>Deployment Params:</h3>
                 <table style={tableWidth1000}>
                   <thead style={thead}>
                     <tr>
                       <td>Date</td>
                       <td>Time</td>
                       <td>Deployer</td>
                       <td>ETH Require to Launch</td>
                       <td>Liquidity Token Lockup</td>
                     </tr>
                   </thead>
                   <tbody style={contractAttributeValue}>
                     {eventInitialized.map((event) => {
                        return (
                          <tr>
                            <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleDateString()}</td>
                            <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleTimeString()}</td>
                            <td>{event.returnValues.deployer}</td>
                            <td>{this.formatBigNumberAttribute(event.returnValues.ethRequiredToLaunchUniSwap)}</td>
                            <td>{event.returnValues.minLiquidityTokensLockup}</td>
                          </tr>
                        )
                      })}
                   </tbody>
                 </table>
                </div>
                <br />

                {/* <hr />*/}
                {/*<div>*/}
                {/*  <h3>Seed Accounts:</h3>*/}
                {/*  <table style={tableWidth1000}>*/}
                {/*    <thead style={thead}>*/}
                {/*      <tr>*/}
                {/*        <td>Date</td>*/}
                {/*        <td>Time</td>*/}
                {/*        <td>Seed Account</td>*/}
                {/*        <td>Total Seed Amount</td>*/}
                {/*        <td>Seed Amount per Account</td>*/}
                {/*      </tr>*/}
                {/*    </thead>*/}
                {/*    <tbody style={contractAttributeValue}>*/}
                {/*      {eventSeedAccountsFunded.map((event) => {*/}
                {/*        return (*/}
                {/*          <tr>*/}
                {/*            <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleDateString()}</td>*/}
                {/*            <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleTimeString()}</td>*/}
                {/*            <td>{event.returnValues.seedAddress}</td>*/}
                {/*            <td>{this.formatBigNumberAttribute(event.returnValues.initialSeedAmount)}</td>*/}
                {/*            <td>{this.formatBigNumberAttribute(event.returnValues.seedAmountPerAccount)}</td>*/}
                {/*          </tr>*/}
                {/*        )*/}
                {/*      })}*/}
                {/*    </tbody>*/}
                {/*  </table>*/}
                {/*</div>*/}
                {/*<br /> */}

                <hr/>
                <br/>
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
                            <td>{this.formatBigNumberAttribute(currentVoteWeightSum)}</td>
                            <td>{this.formatBigNumberAttribute(currentVotesTotal)}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <br/>

                <br/>
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
                                    <td>{currentEpoch + upcomingVote.index}</td>
                                    <td>
                                        {this.formatBigNumberAttribute(upcomingVote.voteWeightSums)}
                                    </td>
                                    <td>
                                        {this.formatBigNumberAttribute(upcomingVote.votesTotal)}
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
                <br/>

                <br/>
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
                                    <td>{this.formatBigNumberAttribute(epochReward)}</td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
                <br/>

                <hr/>
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
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleDateString()}
                                    </td>
                                    <td>
                                        {moment
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleTimeString()}
                                    </td>
                                    <td>{event.returnValues.caller}</td>
                                    <td>{event.returnValues.currentEpoch}</td>
                                    <td>
                                        {event.returnValues.gasTarget}
                                    </td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            event.returnValues.eglAmount
                                        )}
                                    </td>
                                    <td>{event.returnValues.lockupDuration}</td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            new BN(event.returnValues.eglAmount)
                                                .mul(new BN(event.returnValues.lockupDuration))
                                                .toString()
                                        )}
                                    </td>
                                    <td>
                                        {
                                            moment.unix(event.returnValues.releaseDate).local().toDate().toLocaleDateString() +
                                            " " +
                                            moment.unix(event.returnValues.releaseDate).local().toDate().toLocaleTimeString()
                                        }
                                    </td>
                                    <td>
                                        {this.formatBigNumberAttribute(event.returnValues.epochVoteWeightSum)}
                                    </td>
                                    <td>
                                        {this.formatBigNumberAttribute(event.returnValues.epochVoterRewardSum)}
                                    </td>
                                    <td>
                                        {this.formatBigNumberAttribute(event.returnValues.epochTotalVotes)}
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>

                <br/>

                <br/>
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
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleDateString()}
                                    </td>
                                    <td>
                                        {moment
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleTimeString()}
                                    </td>
                                    <td>{event.returnValues.caller}</td>
                                    <td>{event.returnValues.currentEpoch}</td>
                                    <td>
                                        {event.returnValues.gasTarget}
                                    </td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            event.returnValues.tokensLocked
                                        )}
                                    </td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            event.returnValues.rewardTokens
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>

                <br/>
                <div>
                    <b>VoterReward Calculation:</b>
                    <div>
                        Voter Rewards = (Vote Weight / Epoch Total Votes) * Reward
                        Multiplier * Reward Weeks
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
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleDateString()}
                                    </td>
                                    <td>
                                        {moment
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleTimeString()}
                                    </td>
                                    <td>{event.returnValues.voter}</td>
                                    <td>{event.returnValues.currentEpoch}</td>
                                    <td>{52 - event.returnValues.weeksDiv}</td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            event.returnValues.voterReward
                                        )}
                                    </td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            event.returnValues.epochVoterReward
                                        )}
                                    </td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            event.returnValues.voteWeight
                                        )}
                                    </td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            event.returnValues.epochVoterRewardSum
                                        )}
                                    </td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            new BN(event.returnValues.rewardMultiplier).mul(new BN(event.returnValues.weeksDiv))
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
                <br/>

                <hr/>
                <br/>
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
                            <td>Vote Percentage</td>
                            <td>Average Gas Target</td>
                        </tr>
                        </thead>
                        <tbody style={contractAttributeValue}>
                        {eventVotesTallied.map((event) => {
                            return (
                                <tr>
                                    <td>
                                        {moment
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleDateString()}
                                    </td>
                                    <td>
                                        {moment
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleTimeString()}
                                    </td>
                                    <td>{event.returnValues.caller}</td>
                                    <td>{event.returnValues.currentEpoch}</td>
                                    <td>{event.returnValues.desiredEgl}</td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            event.returnValues.actualVotePercentage
                                        )}
                                        %
                                    </td>
                                    <td>
                                        {event.returnValues.averageGasTarget}
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>

                <br/>
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
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleDateString()}
                                    </td>
                                    <td>
                                        {moment
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleTimeString()}
                                    </td>
                                    <td>{event.returnValues.caller}</td>
                                    <td>{event.returnValues.currentEpoch}</td>
                                    <td>{event.returnValues.desiredEgl}</td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            event.returnValues.voteThreshold
                                        )}
                                        %
                                    </td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            event.returnValues.actualVotePercentage
                                        )}
                                        %
                                    </td>
                                    <td>{event.returnValues.gasLimitSum}</td>
                                    <td>{event.returnValues.voteCount}</td>
                                    <td>{event.returnValues.baselineEgl}</td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>

                <br/>
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
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleDateString()}
                                    </td>
                                    <td>
                                        {moment
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleTimeString()}
                                    </td>
                                    <td>{event.returnValues.caller}</td>
                                    <td>{event.returnValues.currentEpoch}</td>
                                    <td>{event.returnValues.desiredEgl}</td>
                                    <td>{event.returnValues.initialEgl}</td>
                                    <td>{event.returnValues.baselineEgl}</td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            event.returnValues.voteThreshold
                                        )}
                                        %
                                    </td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            event.returnValues.actualVotePercentage
                                        )}
                                        %
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
                <br/>

                <hr/>
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
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleDateString()}
                                    </td>
                                    <td>
                                        {moment
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleTimeString()}
                                    </td>
                                    <td>{event.returnValues.caller}</td>
                                    <td>{event.returnValues.creatorRewardAddress}</td>
                                    <td>{event.returnValues.currentEpoch}</td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            event.returnValues.amountClaimed
                                        )}
                                    </td>
                                    <td>
                                        {this.formatBigNumberAttribute(
                                            event.returnValues.remainingCreatorReward
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>

                <hr/>
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
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleDateString()}
                                    </td>
                                    <td>
                                        {moment
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleTimeString()}
                                    </td>
                                    <td>{event.returnValues.caller}</td>
                                    <td>{event.returnValues.uniSwapLaunched.toString()}</td>
                                    <td>1:{this.formatBigNumberAttribute(event.returnValues.ethEglRatio)}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.amountReceived)}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.ethToBeDeployed)}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.eglsToBeMatched)}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.eglsMatched)}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.poolTokensReceived)}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.poolTokensHeld)}</td>
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
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleDateString()}
                                    </td>
                                    <td>
                                        {moment
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleTimeString()}
                                    </td>
                                    <td>{event.returnValues.caller}</td>
                                    <td>1:{this.formatBigNumberAttribute(event.returnValues.ethEglRatio)}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.ethToBeDeployed)}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.eglsMatched)}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.poolTokensHeld)}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.poolTokensReceived)}</td>
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
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleDateString()}
                                    </td>
                                    <td>
                                        {moment
                                            .unix(event.returnValues.date)
                                            .local()
                                            .toDate()
                                            .toLocaleTimeString()}
                                    </td>
                                    <td>{event.returnValues.caller}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.currentEglReleased)}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.poolTokensDue)}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.poolTokens)}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.firstEgl)}</td>
                                    <td>{this.formatBigNumberAttribute(event.returnValues.lastEgl)}</td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
}

export default () => (
    <Web3Container
        renderLoading={() => <div>Loading EGL Contract Status Page...</div>}
        render={({web3, accounts, contract, token}) => (
            <EglContractStatus
                accounts={accounts}
                eglContract={contract}
                web3={web3}
                tokenContract={token}
            />
        )}
    />
)
