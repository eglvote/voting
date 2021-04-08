import React from 'react'
import Web3Container from '../lib/Web3Container'
import GenericPageTemplate from '../components/pageTemplates/GenericPageTemplate'
import connectToWeb3 from '../lib/connectToWeb3'
import Card from '../components/atoms/Card'
import KeyValTable from '../components/organisms/VoteTables/ToupleTable'
import PastContractVotesTable from '../components/organisms/VoteTables/PastContractVotesTable'
import ArrowLink from '../components/molecules/ArrowLink'

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
        console.log('about', this.timeout)

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

        const currentCandidateAddress = currentCadidateVote
            ? currentCadidateVote.returnValues.candidate
            : '0x0000'

        const eglBalance = this.state.walletAddress
            ? await token.methods.balanceOf(this.state.walletAddress).call()
            : 0

        this.setState({
            eglBalance,
            candidate: currentCandidateAddress,
            pastVotes,
        })
    }

    render() {
        const { walletAddress, eglBalance, pastVotes } = this.state
        const { contract, token } = this.props

        return (
            <GenericPageTemplate
                connectWeb3={() => connectToWeb3(window)}
                walletAddress={walletAddress}
                eglBalance={String(eglBalance)}
            >
                <div className={'p-12 bg-hailStorm justify-center'}>
                    <div
                        className={'flex flex-col items-center justify-center'}
                    >
                        <div className={'w-2/3 justify-start mb-8'}>
                            <h1
                                className={
                                    'text-salmon text-6xl font-extrabold'
                                }
                            >
                                ABOUT<span className={'text-black'}>.</span>
                            </h1>
                            <div className={'w-32'}>
                                <ArrowLink
                                    className={'ml-1 my-2'}
                                    title={'LEARN MORE'}
                                    color={'babyBlue'}
                                />
                            </div>
                        </div>
                        <Card className={'bg-white w-2/3 border p-8'}>
                            <h1
                                className={
                                    'text-salmon text-2xl font-extrabold'
                                }
                            >
                                {'The Ethereum Gas Limit (EGL) Project'}
                            </h1>
                            <p className={'mt-4'}>
                                The EGL Project... some stuff
                            </p>
                            <p>A</p>
                            <p>A</p>
                            <p>A</p>
                            <p>A</p>
                            <p>A</p>
                            <p>A</p>
                            <p>A</p>
                            <p>A</p>
                        </Card>
                        <div className={'flex w-2/3 justify-between flex-wrap'}>
                            <Card
                                style={{ 'min-width': '48.5%' }}
                                className={'bg-white p-8 border mt-8 truncate'}
                            >
                                <h1
                                    className={
                                        'text-salmon text-2xl font-extrabold'
                                    }
                                >
                                    EGL Contract
                                </h1>
                                <p className={'mt-2'}>{contract._address}</p>
                                <p className={'mt-2'}>
                                    {
                                        <>
                                            <span className={'font-bold'}>
                                                {'Launch Date: '}
                                            </span>
                                            <span>{'Feb 1, 2021'}</span>
                                        </>
                                    }
                                </p>
                            </Card>
                            <Card
                                style={{ 'min-width': '48.5%' }}
                                className={'bg-white p-8 border mt-8 truncate '}
                            >
                                <h1
                                    className={
                                        'text-salmon text-2xl font-extrabold'
                                    }
                                >
                                    Uniswap Contract
                                </h1>
                                <p className={'mt-2'}>{contract._address}</p>
                                <p className={'mt-2'}>
                                    {
                                        <>
                                            <span className={'font-bold'}>
                                                {'Launch Date: '}
                                            </span>
                                            <span>{'Feb 1, 2021'}</span>
                                        </>
                                    }
                                </p>
                            </Card>{' '}
                            <div className={'mt-8 w-full flex justify-start'}>
                                <h3 className={'text-3xl font-extrabold'}>
                                    Upgrade
                                </h3>
                            </div>
                            <Card className={'bg-white w-full border p-8 mt-8'}>
                                <p>
                                    {
                                        'The EGL smart contract can be upgraded to incentivize additional behaviors, change its behavior, or fix bugs. To achieve this, the majority (>50%) of EGL holders must vote to upgrade the smart contract.'
                                    }
                                </p>
                            </Card>
                            <div className={'mt-8 w-full '}>
                                <h3 className={'text-xl mb-4 font-extrabold'}>
                                    Current Contract Votes
                                </h3>
                                <KeyValTable
                                    title={'Proposed New Contract'}
                                    val={this.state.candidate}
                                />
                            </div>
                            <div className={'mt-8 w-full'}>
                                <h3 className={'text-xl mb-4 font-extrabold'}>
                                    Past Contract Votes
                                </h3>
                                <PastContractVotesTable pastVotes={pastVotes} />
                            </div>
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
