import React from 'react'
import Web3Container from '../lib/Web3Container'
import GenericPageTemplate from '../components/pageTemplates/GenericPageTemplate'
import HatBox from '../components/molecules/HatBox'
import { displayComma, fromWei } from '../lib/helpers'
import connectToWeb3 from '../lib/connectToWeb3'
import BigNumber from 'bignumber.js'
import { EGLS_AVAILABLE } from '../lib/constants'
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
        eglsAvailable: 0,
        eglsClaimed: 0,
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
        const { token } = this.props

        const eglBalance = this.state.walletAddress
            ? await token.methods.balanceOf(this.state.walletAddress).call()
            : 0
        const eventEglsMatched = await this.getAllEventsForType('EglsMatched')

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
        })
    }

    render() {
        const {
            walletAddress,
            eglBalance,
            eglsClaimed,
            eglsAvailable,
        } = this.state
        const { contract, token } = this.props

        return (
            <GenericPageTemplate
                connectWeb3={() => connectToWeb3(window)}
                walletAddress={walletAddress}
                eglBalance={String(eglBalance)}
            >
                <div
                    className={'p-12 h-screen bg-hailStorm flex justify-center'}
                >
                    <div className={'w-4/5'}>
                        <h1 className={'text-salmon text-6xl font-extrabold'}>
                            DAO<span className={'text-black'}>.</span>
                        </h1>
                        <div className={'w-32'}>
                            <ArrowLink
                                className={'ml-1 my-2'}
                                title={'LEARN MORE'}
                                color={true}
                            />
                        </div>
                        <h3 className={'text-2xl font-bold'}>
                            Funds available
                        </h3>
                        <div
                            className={'flex justify-center items-start mt-20'}
                        >
                            <div>
                                <HatBox
                                    title={'EGLs AVAILABLE'}
                                    className={'bg-black mr-20 w-120'}
                                >
                                    <p
                                        className={
                                            'font-extrabold text-4xl text-white text-center'
                                        }
                                    >
                                        {displayComma(fromWei(eglsAvailable)) ||
                                            'N/A'}
                                    </p>
                                </HatBox>
                            </div>
                        </div>
                        <div className={'flex justify-center'}>
                            <div
                                className={
                                    'p-8 mt-8 bg-white rounded-xl border'
                                }
                            >
                                <p className={'mt-4'}>
                                    EGL is a fully decentralized protocol. The
                                    EGL DAO was created to fund and support
                                    further development of the protocol. Any
                                    future development of the EGL contract,
                                    security audits, or any other improvement or
                                    advancement of EGL are to be taken by the
                                    Ethereum community, and EGL holders, not by
                                    the EGL creators.{' '}
                                </p>
                                <p className={'mt-4'}>
                                    Allocation of these funds is decided upon by
                                    the EGL voters as part of the voting
                                    process.
                                </p>
                                <p className={'mt-4'}>
                                    EGL voters can distribute up to 5M EGLs per
                                    vote from the DAO to be sent to a specified
                                    address. For DAO funds to be distributed, at
                                    least 20% of the circulating EGLS must
                                    participate in the vote, and their majority
                                    (over 50%) must specify the same single
                                    address. Furthermore, the DAO recipient
                                    address must be voted on to receive funds in
                                    two consecutive weeks.
                                </p>
                                <p className={'mt-4'}>
                                    The weighted average of all the voters who
                                    voted in favor of distributing funds is used
                                    to determine the exact amount to be
                                    distributed to the specified address.
                                </p>
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
