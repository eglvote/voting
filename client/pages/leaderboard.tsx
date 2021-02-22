import React from 'react'
import Web3Container from '../lib/Web3Container'
import GenericPageTemplate from '../components/pageTemplates/GenericPageTemplate'
import connectToWeb3 from '../lib/connectToWeb3'
import BigNumber from 'bignumber.js'
import { EGLS_AVAILABLE } from '../lib/constants'
import LeaderboardTable from '../components/organisms/LeaderboardTable'
import Card from '../components/atoms/Card'
import { getVoters } from '../lib/contractMethods'

interface LeaderBoardProps {
    accounts: any
    web3Reader?: any
    contract: any
    web3: any
    token: any
}

class LeaderBoard extends React.Component<LeaderBoardProps> {
    state = {
        walletAddress: this.props.accounts[0],
        eglBalance: 0,
        eglsAvailable: 0,
        eglsClaimed: 0,
        seedAccounts: [],
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
                clearInterval(this.timeout)
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
        const { contract, token } = this.props

        const eglBalance = this.state.walletAddress
            ? await token.methods.balanceOf(this.state.walletAddress).call()
            : 0
        const eventEglsMatched = await this.getAllEventsForType('EglsMatched')
        const eventSeedAccountFunded = await this.getAllEventsForType(
            'SeedAccountFunded'
        )

        const getSeedAccountVoterData = async () => {
            return Promise.all(
                eventSeedAccountFunded.map(async (account) => {
                    const voterData = await getVoters(
                        contract,
                        account.returnValues.seedAddress
                    )
                    voterData.account = account
                    return voterData
                })
            )
        }

        const seedAccounts = await getSeedAccountVoterData()

        const eglsClaimed = eventEglsMatched.reduce(
            (acc, e) =>
                new BigNumber(acc).plus(
                    new BigNumber(e.returnValues.eglsMatched)
                ),
            0
        )
        const eglsAvailable = new BigNumber(EGLS_AVAILABLE).minus(eglsClaimed)

        this.setState({
            eglBalance,
            eglsClaimed: eglsClaimed.toFixed(),
            eglsAvailable: eglsAvailable.toFixed(),
            seedAccounts,
        })
    }

    render() {
        const {
            walletAddress,
            eglBalance,
            eglsClaimed,
            eglsAvailable,
            seedAccounts,
        } = this.state
        const { contract, token } = this.props

        return (
            <GenericPageTemplate
                connectWeb3={() => connectToWeb3(window)}
                walletAddress={walletAddress}
                eglBalance={String(eglBalance)}
            >
                <div className={'flex justify-center bg-hailStorm p-16'}>
                    <div className={'flex flex-col w-2/3 items-center'}>
                        <Card className={'bg-white border p-8 mb-8'}>
                            <h1
                                className={
                                    'text-salmon text-2xl font-extrabold'
                                }
                            >
                                {'Elevating Community Voices'}
                            </h1>
                            <p className={'mt-4'}>
                                While EGL is a PoS system, we believe that some
                                voices in the community should be heard even if
                                they are not in a financial position to affect
                                the EGL vote. Specifically, the Ethereum
                                ecosystem would benefit from giving a voice to a
                                range of opinions from ETH Core Devs, DEX
                                operators, Researchers and other leaders in the
                                community.
                            </p>
                            <p className={'mt-4'}>
                                Thus, 4M EGLS are to be awarded to such
                                individuals for participating as EGL voters in
                                the network. We’ve noted these individuals on
                                the leaderboard page as “EGL Seed”. Their EGLs
                                are locked for a full year and are awarded only
                                if they participate in the network.
                            </p>
                        </Card>
                        <LeaderboardTable
                            contract={contract}
                            seedAccounts={seedAccounts}
                        />
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
            <LeaderBoard
                accounts={accounts}
                contract={contract}
                web3={web3}
                token={token}
            />
        )}
    />
)
