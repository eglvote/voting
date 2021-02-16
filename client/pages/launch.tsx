import React from 'react'
import Web3Container from '../lib/Web3Container'
import GenericPageTemplate from '../components/pageTemplates/GenericPageTemplate'
import HatBox from '../components/molecules/HatBox'
import { displayComma, fromWei } from '../lib/helpers'
import connectToWeb3 from '../lib/connectToWeb3'
import BigNumber from 'bignumber.js'
import Button from '../components/atoms/Button'
import ClaimModal from '../components/organisms/ClaimModal'
import { EGLS_AVAILABLE, DEFAULT_ETH_EGL_RATIO } from '../lib/constants'
import PoolTokenCard from '../components/organisms/PoolTokenCard'
import ReleaseScheduleCard from '../components/organisms/ReleaseScheduleCard'
import m from 'moment'

interface LaunchProps {
    accounts: any
    web3Reader?: any
    contract: any
    web3: any
    token: any
}

class Launch extends React.Component<LaunchProps> {
    state = {
        walletAddress: this.props.accounts[0],
        eglBalance: 0,
        eglsClaimed: 0,
        eglsAvailable: 0,
        ethEglRatio: 0,
        showClaimModal: false,
        totalPoolTokens: 0,
        lockedPoolTokens: 0,
        unlockedPoolTokens: 0,
        eventEglsMatched: [],
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
        const ethEglRatio = eventEglsMatched.length
            ? eventEglsMatched[eventEglsMatched.length - 1].returnValues
                  .ethEglRatio
            : DEFAULT_ETH_EGL_RATIO

        const totalPoolTokens = eventEglsMatched
            .filter((event) => {
                return event.returnValues.caller === this.state.walletAddress
            })
            .reduce((acc, event) => {
                acc = acc.plus(new BigNumber(event.returnValues.eglsMatched))
                return acc
            }, new BigNumber(0))
            .toFixed()

        const lockedPoolTokens = eventEglsMatched
            .filter((event) => {
                return (
                    event.returnValues.caller === this.state.walletAddress &&
                    m().unix() > Number(event.returnValues.date)
                )
            })
            .reduce((acc, event) => {
                acc = acc.plus(new BigNumber(event.returnValues.eglsMatched))
                return acc
            }, new BigNumber(0))
            .toFixed()

        const unlockedPoolTokens = eventEglsMatched
            .filter((event) => {
                return (
                    event.returnValues.caller === this.state.walletAddress &&
                    m().unix() < Number(event.returnValues.date)
                )
            })
            .reduce((acc, event) => {
                acc = acc.plus(new BigNumber(event.returnValues.eglsMatched))
                return acc
            }, new BigNumber(0))
            .toFixed()

        const eglsClaimed = eventEglsMatched.reduce((acc, e) => {
            acc = new BigNumber(acc).plus(
                new BigNumber(e.returnValues.eglsMatched)
            )
            return acc
        }, 0)

        const eglsAvailable = new BigNumber(EGLS_AVAILABLE).minus(eglsClaimed)

        this.setState({
            eglBalance,
            eglsClaimed: eglsClaimed.toFixed(),
            eglsAvailable: eglsAvailable.toFixed(),
            ethEglRatio,
            totalPoolTokens,
            lockedPoolTokens,
            unlockedPoolTokens,
            eventEglsMatched,
        })
    }

    render() {
        const {
            walletAddress,
            eglBalance,
            eglsClaimed,
            eglsAvailable,
            ethEglRatio,
            totalPoolTokens,
            lockedPoolTokens,
            unlockedPoolTokens,
            eventEglsMatched,
        } = this.state
        const { contract, token } = this.props
        return (
            <GenericPageTemplate
                connectWeb3={() => connectToWeb3(window)}
                walletAddress={walletAddress}
                eglBalance={String(eglBalance)}
            >
                <div
                    style={{ height: '110vh' }}
                    className={'p-12 bg-hailStorm'}
                >
                    <h1 className={'text-salmon text-4xl font-extrabold'}>
                        LAUNCH<span className={'text-black'}>.</span>
                    </h1>
                    <h3 className={'text-2xl font-bold'}>
                        Participate in the EGL Launch
                    </h3>
                    {/* <div className={' flex justify-center'}>
                        <div className={' flex flex-col w-2/3'}> */}
                    <div className={'flex justify-center items-start mt-20'}>
                        <div>
                            <HatBox
                                title={'EGLs CLAIMED'}
                                className={'bg-black mr-20 w-96'}
                            >
                                <p
                                    className={
                                        'font-extrabold text-4xl text-white text-center'
                                    }
                                >
                                    {eglsClaimed == '0'
                                        ? '-'
                                        : displayComma(fromWei(eglsClaimed))}
                                </p>
                            </HatBox>
                            <p className={'text-sm'}>
                                EGL Contract has 750,000,000 EGLs available for
                                launch.
                            </p>
                        </div>
                        <HatBox
                            title={'EGLs AVAILABLE'}
                            className={'bg-black w-96'}
                        >
                            <p className={'font-extrabold text-4xl text-white'}>
                                {displayComma(fromWei(eglsAvailable)) || 'N/A'}
                            </p>
                        </HatBox>
                    </div>

                    <div className={'mt-8 flex justify-center'}>
                        <Button
                            className={''}
                            handleClick={() =>
                                this.setState({ showClaimModal: true })
                            }
                        >
                            <p>PARTICIPATE</p>
                        </Button>
                    </div>
                    <h3 className={'text-2xl font-bold m-4'}>
                        Your Pool Tokens
                    </h3>
                    <PoolTokenCard
                        contract={contract}
                        walletAddress={walletAddress}
                        totalPoolTokens={totalPoolTokens}
                        lockedPoolTokens={lockedPoolTokens}
                        unlockedPoolTokens={unlockedPoolTokens}
                    />
                    <ReleaseScheduleCard eventEglsMatched={eventEglsMatched} />
                    {/* </div>
                    </div> */}
                </div>

                <div style={{ height: '110vh' }} className={'mb-20'}>
                    <img className={'w-full p-32'} src={'static/6.png'} />
                </div>
                {this.state.showClaimModal && (
                    <ClaimModal
                        contract={contract}
                        token={token}
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
                    className="opacity-25 fixed inset-0 z-30 bg-black"
                />
            </GenericPageTemplate>
        )}
        render={({ web3, accounts, contract, token }) => (
            <Launch
                accounts={accounts}
                contract={contract}
                web3={web3}
                token={token}
            />
        )}
    />
)
