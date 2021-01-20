import React from 'react'
import Web3Container from "../lib/Web3Container";
import Link from "next/link";
import moment from 'moment';
import BN from "bn.js";

const tableWidth1000 = {
  width: '100%',
};

const tableWidth50 = {
  width: '50%',
};

const thead = {
  backgroundColor: "#3d3d3d",
  fontWeight: "bold",
  color: "white",
};

const contractAttributeValue = {
  fontFamily: "Courier New",
  fontSize: "10pt",
}

class EglContractStatus extends React.Component {
  state = {
    ethBalance: null,
    eglBalance: null,
    voterData: null,
  }

  desiredChangeMap = {
    0: "Up",
    1: "Same",
    2: "Down"
  }

  formatBigNumberAttribute = (attribute) => {
    const { web3 } = this.props
    return parseFloat(web3.utils.fromWei(attribute)).toFixed(3)
  }

  getAllEventsForType = async (eventName) => {
    const { eglContract } = this.props
    return await eglContract.getPastEvents(eventName, {
      fromBlock: 0,
      toBlock: 'latest'
    })
  }

  refreshContractData = async () => {
    const { eglContract, web3, tokenContract } = this.props

    const eglContractTokenBalance = await tokenContract.methods.balanceOf(eglContract._address).call()

    const currentEpoch = await eglContract.methods.currentEpoch().call()
    const remainingPoolReward = await eglContract.methods.remainingPoolReward().call()
    const tokensInCirculation = await eglContract.methods.tokensInCirculation().call()
    const remainingCreatorRewards = await eglContract.methods.remainingCreatorReward().call()
    const currentEpochStartDate = moment.unix(await eglContract.methods.currentEpochStartDate().call())

    const currentVotesUp = await eglContract.methods.directionVoteCount(0, 0).call()
    const currentVotesSame = await eglContract.methods.directionVoteCount(1, 0).call()
    const currentVotesDown = await eglContract.methods.directionVoteCount(2, 0).call()
    const currentVotesTotal = await eglContract.methods.votesTotal(0).call()

    const timeToNextEpoch = (currentEpochStartDate.unix() + 3600) - moment().unix()

    const voterRewardsSums = []
    for (let i = 0; i <= currentEpoch; i++){
      voterRewardsSums.push(await eglContract.methods.voterRewardSums(i).call())
    }


    const eventVotesTallied = await this.getAllEventsForType("VotesTallied")
    const eventCreatorRewardsClaimed = await this.getAllEventsForType("CreatorRewardsClaimed")
    const eventVote = await this.getAllEventsForType("Vote")
    const eventNewVoteTotals = await this.getAllEventsForType("NewVoteTotals")
    const eventWithdraw = await this.getAllEventsForType("Withdraw")
    const eventSeedAccountsFunded = await this.getAllEventsForType("SeedAccountsFunded")
    const eventVoteThresholdMet = await this.getAllEventsForType("VoteThresholdMet")
    const eventVoteThresholdFailed = await this.getAllEventsForType("VoteThresholdFailed")
    const eventVoterRewardCalculated = await this.getAllEventsForType("VoterRewardCalculated")

    const upcomingVotes = []
    for (let i = 1; i < 8; i++) {
      upcomingVotes.push({
        "index": i,
        "votesUp": await eglContract.methods.directionVoteCount(0, i).call(),
        "votesSame": await eglContract.methods.directionVoteCount(1, i).call(),
        "votesDown": await eglContract.methods.directionVoteCount(2, i).call(),
        "votesTotal": await eglContract.methods.votesTotal(i).call(),
      })
    }

    this.setState({
      currentTime: moment(),
      eglContractTokenBalance: eglContractTokenBalance,
      currentEpoch: parseInt(currentEpoch),
      currentEpochStartDate: currentEpochStartDate,
      timeToNextEpoch: timeToNextEpoch,
      tokensInCirculation: tokensInCirculation,
      remainingPoolReward: remainingPoolReward,
      currentVotesUp: currentVotesUp,
      currentVotesSame: currentVotesSame,
      currentVotesDown: currentVotesDown,
      currentVotesTotal: currentVotesTotal,
      upcomingVotes: upcomingVotes,
      voterRewardsSums: voterRewardsSums,
      eventSeedAccountsFunded: eventSeedAccountsFunded,
      eventVotesTallied: eventVotesTallied,
      eventCreatorRewardsClaimed: eventCreatorRewardsClaimed,
      eventVote: eventVote,
      eventWithdraw: eventWithdraw,
      eventVoteThresholdMet: eventVoteThresholdMet,
      eventVoteThresholdFailed: eventVoteThresholdFailed,
      eventNewVoteTotals: eventNewVoteTotals,
      eventVoterRewardCalculated: eventVoterRewardCalculated,
    })
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refreshContractData(), 1000);
    // this.refreshContractData()
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    const {
      currentTime = moment(),
      eglContractTokenBalance = '-',
      currentEpoch = '-',
      currentEpochStartDate = moment(),
      timeToNextEpoch = '-',
      tokensInCirculation = '-',
      remainingPoolReward = '-',
      currentVotesUp = '-',
      currentVotesSame = '-',
      currentVotesDown = '-',
      currentVotesTotal = '-',
      upcomingVotes = [],
      voterRewardsSums = [],
      eventSeedAccountsFunded = [],
      eventVotesTallied = [],
      eventCreatorRewardsClaimed = [],
      eventVote = [],
      eventWithdraw = [],
      eventVoteThresholdMet =  [],
      eventVoteThresholdFailed = [],
      eventNewVoteTotals = [],
      eventVoterRewardCalculated = [],

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
        <hr />

        <div>
          <div>
            <b>Current Date: </b>
            <span style={contractAttributeValue}>{currentTime.local().toDate().toLocaleDateString()} {currentTime.local().toDate().toLocaleTimeString()}</span>
          </div>
          <br />
          <table style={tableWidth1000}>
            <tbody>
            <tr>
              <td>
                <b>Current Epoch :</b> <span style={contractAttributeValue}>{currentEpoch}</span>
              </td>
              <td>
                <b>EGL Contract Token Balance: </b>
                <span style={contractAttributeValue}>{(this.formatBigNumberAttribute(eglContractTokenBalance))} EGL </span>
              </td>
            </tr>
            <tr>
              <td>
                <b>Epoch Start Date :</b> <span style={contractAttributeValue}>{currentEpochStartDate.local().toDate().toString()}</span>
              </td>
              <td>
                <b>Tokens in Circulation: </b>
                <span style={contractAttributeValue}>{this.formatBigNumberAttribute(tokensInCirculation)} EGL</span>
              </td>
            </tr>
            <tr>
              <td>
                <b>Time to Next Epoch :</b> <span style={contractAttributeValue}>{timeToNextEpoch} seconds</span>
              </td>
              <td></td>
            </tr>
            </tbody>
          </table>
        </div>
        <br />

        {/*<hr />*/}
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
        {/*<br />*/}

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
                <td>Votes Up</td>
                <td>Votes Same</td>
                <td>Votes Down</td>
                <td>Total Locked Tokens</td>
              </tr>
            </thead>
            <tbody style={contractAttributeValue}>
              <tr>
                <td>{currentEpoch}</td>
                <td>{this.formatBigNumberAttribute(currentVotesUp)}</td>
                <td>{this.formatBigNumberAttribute(currentVotesSame)}</td>
                <td>{this.formatBigNumberAttribute(currentVotesDown)}</td>
                <td>{this.formatBigNumberAttribute(currentVotesTotal)}</td>
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
                <td>Votes Up</td>
                <td>Votes Same</td>
                <td>Votes Down</td>
                <td>Total Locked Tokens</td>
              </tr>
            </thead>
            <tbody style={contractAttributeValue}>
              {upcomingVotes.map((upcomingVote) => {
                return (
                  <tr>
                    <td>{currentEpoch + upcomingVote.index}</td>
                    <td>{this.formatBigNumberAttribute(upcomingVote.votesUp)}</td>
                    <td>{this.formatBigNumberAttribute(upcomingVote.votesSame)}</td>
                    <td>{this.formatBigNumberAttribute(upcomingVote.votesDown)}</td>
                    <td>{this.formatBigNumberAttribute(upcomingVote.votesTotal)}</td>
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
                <td>{this.formatBigNumberAttribute(epochReward)}</td>
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
              <td>Vote Direction</td>
              <td>EGL Amount</td>
              <td>Lockup Duration</td>
              <td>Vote Weight</td>
            </tr>
            </thead>
            <tbody style={contractAttributeValue}>
              {eventVote.map((event) => {
                  return (
                    <tr>
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleDateString()}</td>
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleTimeString()}</td>
                      <td>{event.returnValues.caller}</td>
                      <td>{event.returnValues.currentEpoch}</td>
                      <td>{this.desiredChangeMap[event.returnValues.desiredChange]}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.eglAmount)}</td>
                      <td>{event.returnValues.lockupDuration}</td>
                      <td>
                        {this.formatBigNumberAttribute(
                          new BN(event.returnValues.eglAmount).mul(new BN(event.returnValues.lockupDuration)).toString()
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
          <b>Vote Totals After Vote:</b>
          <table style={tableWidth1000}>
            <thead style={thead}>
            <tr>
              <td>Date</td>
              <td>Time</td>
              <td>Caller</td>
              <td>Current Epoch </td>
              <td>Votes Up</td>
              <td>Votes Same</td>
              <td>Votes Down</td>
              <td>Votes Total</td>
              <td>Total Locked Tokens</td>
            </tr>
            </thead>
            <tbody style={contractAttributeValue}>
              {eventNewVoteTotals.map((event) => {
                  return (
                    <tr>
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleDateString()}</td>
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleTimeString()}</td>
                      <td>{event.returnValues.caller}</td>
                      <td>{event.returnValues.currentEpoch}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.epochVotesUp)}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.epochVotesSame)}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.epochVotesDown)}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.epochVoterRewardSum)}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.epochTotalVotes)}</td>
                    </tr>
                  )
              })}
            </tbody>
          </table>
        </div>

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
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleDateString()}</td>
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleTimeString()}</td>
                      <td>{event.returnValues.caller}</td>
                      <td>{event.returnValues.currentEpoch}</td>
                      <td>{this.desiredChangeMap[event.returnValues.desiredChange]}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.tokensLocked)}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.rewardTokens)}</td>
                    </tr>
                  )
              })}
            </tbody>
          </table>
        </div>

        <br />
        <div>
          <b>VoterReward Calculation:</b>
          <div>Voter Rewards = (Vote Weight / Epoch Total Votes) * Reward Multiplier * Reward Weeks</div>
          <table style={tableWidth1000}>
            <thead style={thead}>
            <tr>
              <td>Date</td>
              <td>Time</td>
              <td>Voter</td>
              <td>Cumulative Reward</td>
              <td>Reward per Epoch</td>
              <td>Vote Weight</td>
              <td>Epoch Total Votes</td>
              <td>Reward Multiplier</td>
              <td>Reward Weeks</td>
            </tr>
            </thead>
            <tbody style={contractAttributeValue}>
              {eventVoterRewardCalculated.map((event) => {
                  return (
                    <tr>
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleDateString()}</td>
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleTimeString()}</td>
                      <td>{event.returnValues.voter}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.voterReward)}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.epochVoterReward)}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.voteWeight)}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.epochVoterRewardSum)}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.rewardMultiplier)}</td>
                      <td>{event.returnValues.weeksDiv}</td>
                    </tr>
                  )
              })}
            </tbody>
          </table>
        </div>

        {/*<br />*/}
        {/*<div>*/}
        {/*  <b>Vote Totals After Withdraw:</b>*/}
        {/*  <table style={tableWidth1000}>*/}
        {/*    <thead style={thead}>*/}
        {/*    <tr>*/}
        {/*      <td>Date</td>*/}
        {/*      <td>Time</td>*/}
        {/*      <td>Caller</td>*/}
        {/*      <td>Current Epoch </td>*/}
        {/*      <td>Votes Up</td>*/}
        {/*      <td>Votes Same</td>*/}
        {/*      <td>Votes Down</td>*/}
        {/*      <td>Votes Reward Sum</td>*/}
        {/*      <td>Total Votes (EGL's)</td>*/}
        {/*    </tr>*/}
        {/*    </thead>*/}
        {/*    <tbody style={contractAttributeValue}>*/}
        {/*      {eventWithdraw.map((event) => {*/}
        {/*          return (*/}
        {/*            <tr>*/}
        {/*              <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleDateString()}</td>*/}
        {/*              <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleTimeString()}</td>*/}
        {/*              <td>{event.returnValues.caller}</td>*/}
        {/*              <td>{event.returnValues.currentEpoch}</td>*/}
        {/*              <td>{this.formatBigNumberAttribute(event.returnValues.epochVotesUp)}</td>*/}
        {/*              <td>{this.formatBigNumberAttribute(event.returnValues.epochVotesSame)}</td>*/}
        {/*              <td>{this.formatBigNumberAttribute(event.returnValues.epochVotesDown)}</td>*/}
        {/*              <td>{this.formatBigNumberAttribute(event.returnValues.epochVoterRewardSum)}</td>*/}
        {/*              <td>{this.formatBigNumberAttribute(event.returnValues.epochTotalVotes)}</td>*/}
        {/*            </tr>*/}
        {/*          )*/}
        {/*      })}*/}
        {/*    </tbody>*/}
        {/*  </table>*/}
        {/*</div>*/}
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
              <td>Vote Percentage</td>
              <td>Total Up</td>
              <td>Total Same</td>
              <td>Total Down</td>
            </tr>
            </thead>
            <tbody style={contractAttributeValue}>
              {eventVotesTallied.map((event) => {
                  return (
                    <tr>
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleDateString()}</td>
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleTimeString()}</td>
                      <td>{event.returnValues.caller}</td>
                      <td>{event.returnValues.currentEpoch}</td>
                      <td>{event.returnValues.desiredEgl}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.actualVotePercentage)}%</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.totalVotesUp)}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.totalVotesSame)}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.totalVotesDown)}</td>
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
              <td>Vote Count</td>
              <td>Baseline EGL</td>
            </tr>
            </thead>
            <tbody style={contractAttributeValue}>
              {eventVoteThresholdMet.map((event) => {
                  return (
                    <tr>
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleDateString()}</td>
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleTimeString()}</td>
                      <td>{event.returnValues.caller}</td>
                      <td>{event.returnValues.currentEpoch}</td>
                      <td>{event.returnValues.desiredEgl}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.voteThreshold)}%</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.actualVotePercentage)}%</td>
                      <td>{event.returnValues.gasLimitSum}</td>
                      <td>{event.returnValues.voteCount}</td>
                      <td>{event.returnValues.baselineEgl}</td>
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
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleDateString()}</td>
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleTimeString()}</td>
                      <td>{event.returnValues.caller}</td>
                      <td>{event.returnValues.currentEpoch}</td>
                      <td>{event.returnValues.desiredEgl}</td>
                      <td>{event.returnValues.initialEgl}</td>
                      <td>{event.returnValues.baselineEgl}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.voteThreshold)}%</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.actualVotePercentage)}%</td>
                    </tr>
                  )
              })}
            </tbody>
          </table>
        </div>
        <br />

        <hr />
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
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleDateString()}</td>
                      <td>{moment.unix(event.returnValues.date).local().toDate().toLocaleTimeString()}</td>
                      <td>{event.returnValues.caller}</td>
                      <td>{event.returnValues.creatorRewardAddress}</td>
                      <td>{event.returnValues.currentEpoch}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.amountClaimed)}</td>
                      <td>{this.formatBigNumberAttribute(event.returnValues.remainingCreatorReward)}</td>
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
    render={({ web3, accounts, contract, token }) => (
      <EglContractStatus accounts={accounts} eglContract={contract} web3={web3} tokenContract={token} />
    )}
  />
)
