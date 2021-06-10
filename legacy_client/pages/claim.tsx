import React from 'react'
import Web3Container from '../lib/Web3Container'
import GenericPageTemplate from '../components/pageTemplates/GenericPageTemplate'
// import { displayComma, fromWei } from '../lib/helpers'
import connectToWeb3 from '../lib/connectToWeb3'
// import BigNumber from 'bignumber.js'
import Button from '../components/atoms/Button'
import ClaimModal from '../components/organisms/ClaimModal'
// import { EGLS_AVAILABLE, DEFAULT_ETH_EGL_RATIO } from '../lib/constants'
// import m from 'moment'
import ArrowLink from '../components/molecules/ArrowLink'
// import ClaimTable from '../components/organisms/VoteTables/ClaimTable'
// import { withdrawLiquidityTokens } from '../lib/contractMethods'
// import HowToClaim from '../components/organisms/HowToClaim'
// import NestedBox from '../components/molecules/NestedBox'

interface ClaimProps {
    accounts: any
    web3Reader?: any
    contract: any
    web3: any
    token: any
}

class Claim extends React.Component<ClaimProps> {
    state = {
        walletAddress: this.props.accounts[0],
        eglBalance: '0',
        eglsClaimed: '0',
        eglsAvailable: '0',
        ethEglRatio: '0',
        showClaimModal: false,
        totalPoolTokens: '0',
        lockedPoolTokens: '0',
        unlockedPoolTokens: '0',
        eventEglsMatched: [],
        totalEthSent: '0',
        claimDate: '0',
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
        console.log('launch', this.timeout)
        const eglBalance = this.state.walletAddress
            ? await token.methods.balanceOf(this.state.walletAddress).call()
            : 0

        // const eventEglsMatched = await this.getAllEventsForType('EglsMatched')

        // const ethEglRatio = eventEglsMatched.length
        //     ? eventEglsMatched[eventEglsMatched.length - 1].returnValues
        //           .ethEglRatio
        //     : DEFAULT_ETH_EGL_RATIO

        // const totalPoolTokens = eventEglsMatched
        //     .filter((event) => {
        //         return event.returnValues.caller === this.state.walletAddress
        //     })
        //     .reduce((acc, event) => {
        //         acc = acc.plus(new BigNumber(event.returnValues.eglsMatched))
        //         return acc
        //     }, new BigNumber(0))
        //     .toFixed()

        // const lockedPoolTokens = eventEglsMatched
        //     .filter((event) => {
        //         return (
        //             event.returnValues.caller === this.state.walletAddress &&
        //             m().unix() > Number(event.returnValues.date)
        //         )
        //     })
        //     .reduce((acc, event) => {
        //         acc = acc.plus(new BigNumber(event.returnValues.eglsMatched))
        //         return acc
        //     }, new BigNumber(0))
        //     .toFixed()

        // const unlockedPoolTokens = eventEglsMatched
        //     .filter((event) => {
        //         return (
        //             event.returnValues.caller === this.state.walletAddress &&
        //             m().unix() < Number(event.returnValues.date)
        //         )
        //     })
        //     .reduce((acc, event) => {
        //         acc = acc.plus(new BigNumber(event.returnValues.eglsMatched))
        //         return acc
        //     }, new BigNumber(0))
        //     .toFixed()

        // const totalEthSent = eventEglsMatched
        //     .filter((event) => {
        //         return event.returnValues.caller === this.state.walletAddress
        //     })
        //     .reduce((acc, event) => {
        //         acc = acc.plus(
        //             new BigNumber(event.returnValues.ethToBeDeployed)
        //         )
        //         return acc
        //     }, new BigNumber(0))
        //     .toFixed()

        // const claimDate = eventEglsMatched
        //     .filter((event) => {
        //         return event.returnValues.caller === this.state.walletAddress
        //     })
        //     .map((event) => {
        //         if (event) return event.returnValues.date
        //     })[0]

        // const eglsClaimed = eventEglsMatched.reduce((acc, e) => {
        //     acc = new BigNumber(acc).plus(
        //         new BigNumber(e.returnValues.eglsMatched)
        //     )
        //     return acc
        // }, new BigNumber(0))

        // const eglsAvailable = new BigNumber(EGLS_AVAILABLE).minus(eglsClaimed)

        this.setState({
            eglBalance,
            // eglsClaimed: eglsClaimed.toFixed(),
            // eglsAvailable: eglsAvailable.toFixed(),
            //     ethEglRatio,
            //     totalPoolTokens,
            //     lockedPoolTokens,
            //     unlockedPoolTokens,
            //     eventEglsMatched,
            //     totalEthSent,
            //     claimDate,
        })
    }

    render() {
        const {
            walletAddress,
            eglBalance,
            // eglsClaimed,
            // eglsAvailable,
            ethEglRatio,
            // totalPoolTokens,
            // lockedPoolTokens,
            // unlockedPoolTokens,
            // eventEglsMatched,
            // totalEthSent,
            // claimDate,
        } = this.state
        const { contract, token } = this.props
        return (
            <GenericPageTemplate
                connectWeb3={() => connectToWeb3(window)}
                walletAddress={walletAddress}
                eglBalance={String(eglBalance)}
            >
                <div style={{ height: '85vh' }} className={'p-12 bg-hailStorm'}>
                    <div className={'flex justify-center'}>
                        <div className={'w-4/5'}>
                            <h1
                                className={
                                    'text-salmon text-6xl font-extrabold'
                                }
                            >
                                CLAIM<span className={'text-black'}>.</span>
                            </h1>
                            <div className={'w-32'}>
                                <ArrowLink
                                    className={'ml-1 my-2'}
                                    title={'LEARN MORE'}
                                    color={'babyBlue'}
                                />
                            </div>

                            <div className={'mt-8 flex justify-center'}>
                                <Button
                                    className={'w-64 mr-8'}
                                    handleClick={() =>
                                        contract.methods
                                            .withdrawPoolTokens()
                                            .send({ from: walletAddress })
                                    }
                                >
                                    <p>WITHDRAW POOL TOKENS</p>
                                </Button>
                                <Button
                                    className={'w-64'}
                                    handleClick={() =>
                                        contract.methods
                                            .claimSupporterEgls()
                                            .send({ from: walletAddress })
                                    }
                                >
                                    <p>CLAIM SUPPORTER EGLs</p>
                                </Button>
                            </div>
                            {/* <h3 className={'text-2xl font-bold my-4'}>
                                Your Pool Tokens
                            </h3>
                            <div className={''}>
                                <ClaimTable
                                    date={claimDate}
                                    releaseDate={'0'}
                                    ethSent={totalEthSent}
                                    poolTokens={totalPoolTokens}
                                    locked={lockedPoolTokens}
                                    unlocked={unlockedPoolTokens}
                                />
                                <div
                                    className={
                                        'w-full flex justify-center mt-8'
                                    }
                                >
                                    {unlockedPoolTokens !== '0' && (
                                        <Button
                                            className={'w-40'}
                                            handleClick={() =>
                                                withdrawLiquidityTokens(
                                                    contract,
                                                    walletAddress
                                                )
                                            }
                                        >
                                            <p>WITHDRAW</p>
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <h3 className={'text-2xl font-bold mt-4'}>
                                How Claiming Works{' '}
                            </h3>
                            <HowToClaim /> */}
                        </div>
                    </div>
                </div>
                {this.state.showClaimModal && (
                    <ClaimModal
                        contract={contract}
                        walletAddress={walletAddress}
                        ethEglRatio={ethEglRatio}
                        handleOutsideClick={() =>
                            this.setState({ showClaimModal: false })
                        }
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
                    className="fixed inset-0 z-30 bg-black opacity-25"
                />
            </GenericPageTemplate>
        )}
        render={({ web3, accounts, contract, token }) => (
            <Claim
                accounts={accounts}
                contract={contract}
                web3={web3}
                token={token}
            />
        )}
    />
)
