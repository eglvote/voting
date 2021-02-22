import React from 'react'
import Web3Container from '../lib/Web3Container'
import GenericPageTemplate from '../components/pageTemplates/GenericPageTemplate'
import connectToWeb3 from '../lib/connectToWeb3'
import Card from '../components/atoms/Card'

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

    ticker = async () => {
        const { token } = this.props

        const eglBalance = this.state.walletAddress
            ? await token.methods.balanceOf(this.state.walletAddress).call()
            : 0

        this.setState({
            eglBalance,
        })
    }

    render() {
        const { walletAddress, eglBalance } = this.state
        const { contract, token } = this.props

        console.log(contract)
        return (
            <GenericPageTemplate
                connectWeb3={() => connectToWeb3(window)}
                walletAddress={walletAddress}
                eglBalance={String(eglBalance)}
            >
                <div className={'p-12 h-screen bg-hailStorm justify-center'}>
                    <div
                        className={'flex flex-col items-center justify-center'}
                    >
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
                        <div className={'flex w-2/3 justify-between mt-8'}>
                            <Card className={'bg-white w-126 p-8 border'}>
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
                            <Card className={'bg-white w-126 p-8 border'}>
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
                            </Card>
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
