import React from 'react'
import Web3Container from '../lib/Web3Container'
import GenericPageTemplate from '../components/pageTemplates/GenericPageTemplate'
import HatBox from '../components/molecules/HatBox'
import { displayComma, fromWei } from '../lib/helpers'
import connectToWeb3 from '../lib/connectToWeb3'
import BigNumber from 'bignumber.js'
import Button from '../components/atoms/Button'
import ClaimModal from '../components/organisms/ClaimModal'
import { EGLS_AVAILABLE } from '../lib/constants'
import { withdrawLiquidityTokens } from '../lib/contractMethods'

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
        eglBalance: 0,
        eglsClaimed: 0,
        eglsAvailable: 0,
        ethEglRatio: 0,
        showClaimModal: false,
    }

    timeout = null

    componentWillMount() {
        this.state.walletAddress && this.ticker()

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
                    this.state.walletAddress && this.ticker()
                }, 1000)
            }
        })
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

        const eglBalance = await token.methods
            .balanceOf(this.state.walletAddress)
            .call()
        const eventEglsMatched = await this.getAllEventsForType('EglsMatched')
        const ethEglRatio = eventEglsMatched.length
            ? eventEglsMatched[eventEglsMatched.length - 1].returnValues
                  .ethEglRatio
            : 1

        const eglsClaimed = eventEglsMatched.reduce(
            (acc, e) =>
                new BigNumber(acc).plus(
                    new BigNumber(e.returnValues.eglsMatched)
                ),
            0
        )
        const eglsAvailable = new BigNumber(EGLS_AVAILABLE).minus(eglsClaimed)

        console.log(eglsClaimed, eglsAvailable)

        this.setState({
            eglBalance,
            eglsClaimed: eglsClaimed.toFixed(),
            eglsAvailable: eglsAvailable.toFixed(),
            ethEglRatio,
        })
    }

    render() {
        const {
            walletAddress,
            eglBalance,
            eglsClaimed,
            eglsAvailable,
            ethEglRatio,
        } = this.state
        const { contract, token } = this.props

        return (
            <GenericPageTemplate
                connectWeb3={() => connectToWeb3(window)}
                walletAddress={walletAddress}
                eglBalance={String(eglBalance)}
            >
                <div className={'p-12 h-screen'}>
                    <h1 className={'text-salmon text-4xl font-extrabold'}>
                        CLAIM<span className={'text-black'}>.</span>
                    </h1>
                    <h3 className={'text-2xl font-bold'}>EGL Launch</h3>
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
                                    {displayComma(fromWei(eglsClaimed)) ||
                                        'N/A'}
                                </p>
                            </HatBox>
                            <p>EGL Contract has 750,000,000 EGLs available.</p>
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
                            className={'w-32 mr-8'}
                            handleClick={() =>
                                this.setState({ showClaimModal: true })
                            }
                        >
                            <p>CLAIM</p>
                        </Button>
                        <Button
                            // style={{ 'margin-top': '1em' }}
                            className={'w-32'}
                            handleClick={() =>
                                withdrawLiquidityTokens(contract, walletAddress)
                            }
                        >
                            <p>WITHDRAW</p>
                        </Button>
                    </div>
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
            <Claim
                accounts={accounts}
                contract={contract}
                web3={web3}
                token={token}
            />
        )}
    />
)
