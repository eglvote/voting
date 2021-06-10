import React, { useEffect, useState } from 'react'
import GenericPage from '../components/pageTemplates/GenericPage'
import BodyHeader from '../components/molecules/BodyHeader'
import SideFooter from '../components/organisms/SideFooter'
import Web3Container from '../components/lib/Web3Container'
import connectToWeb3 from '../components/lib/connectToWeb3'
import useMediaQuery from '../components/hooks/UseMediaQuery'
import Vote from '../components/organisms/Vote'
import Withdraw from '../components/organisms/Withdraw'
import clsx from 'clsx'
import ClaimModal from '../components/organisms/ClaimModal'

declare global {
    interface Window {
        ethereum: any
    }
}

interface IndexProps {
    accounts: any
    web3Reader?: any
    contract: any
    web3: any
}

const Index = ({ accounts, web3, contract }: IndexProps) => {
    const [modal, setModal] = useState(false)
    const [cumulativeBalance, setCumulativeBalance] = useState('0')
    const [hasContributed, setHasContributed] = useState(false)
    const [walletAddress, setWalletAddress] = useState(
        accounts ? accounts[0] : null
    )
    const [ended, setEnded] = useState(false)
    const [amountContributed, setAmountContributed] = useState('0')
    const [contractBalance, setContractBalance] = useState('0')
    const [
        contributorCumulativeBalance,
        setContributorCumulativeBalance,
    ] = useState('0')
    const [showClaimModal, setShowClaimModal] = useState(false)

    let isPageWide = useMediaQuery('(min-width: 800px)')

    const ticker = async () => {
        let response = await contract.methods
            .cumulativeBalance()
            .call({ from: '0x0000000000000000000000000000000000000000' })

        setCumulativeBalance(web3.utils.fromWei(response))

        if (walletAddress) {
            let contributor = await contract.methods
                .contributors(walletAddress)
                .call({ from: walletAddress })

            let positive = contributor.amount > 0
            setAmountContributed(contributor.amount)
            setContributorCumulativeBalance(contributor.cumulativeBalance)

            if (positive) {
                setHasContributed(positive)
                setModal(false)
            }
        } else {
            setHasContributed(false)
        }

        let canContribute = await contract.methods
            .canContribute()
            .call({ from: '0x0000000000000000000000000000000000000000' })

        let canWithdraw = await contract.methods
            .canWithdraw()
            .call({ from: '0x0000000000000000000000000000000000000000' })

        let balance = await contract.methods
            .cumulativeBalance()
            .call({ from: '0x0000000000000000000000000000000000000000' })

        setContractBalance(balance)
        if (!canContribute && !canWithdraw) {
            setEnded(true)
        }

        window.ethereum.on('accountsChanged', (accounts) => {
            setWalletAddress(accounts[0])
            // ticker()
        })
    }

    if (walletAddress) {
        window.ethereum.on('accountsChanged', (accounts) => {
            setWalletAddress(accounts[0])
            ticker()
        })
    }

    // console.log('!!', walletAddress)
    useEffect(() => {
        ticker()
        const interval = setInterval(ticker, 1000)

        // let apocalypse = contract.methods
        //     .endGenesis()
        //     .send({ from: walletAddress })
        // console.log(apocalypse)
        return () => {
            clearInterval(interval)
        }
    }, [])

    console.log(contract)
    return (
        <GenericPage
            connectWeb3={() => connectToWeb3(window)}
            walletAddress={walletAddress}
        >
            <main
                style={{
                    height: isPageWide ? '100vh' : '105vh',
                    width: isPageWide ? '100%' : '115vw',
                    zIndex: -2,
                    position: 'fixed',
                    // backgroundImage: `url(${grey})`,
                }}
                className='flex flex-row bg-dark'
            >
                <div
                    style={{ width: '100%' }}
                    className={'w-full flex flex-row justify-center'}
                >
                    <div style={{ width: isPageWide ? '15%' : '0' }} />
                    <div
                        style={{ width: isPageWide ? '40%' : '80%' }}
                        className={'flex'}
                    >
                        <div>
                            <h1
                                className={
                                    'text-white text-5xl font-bold mt-16'
                                }
                            >
                                $EGL Genesis.
                            </h1>
                            <BodyHeader className={'ml-4'} />
                            <div className={'mt-16'}>
                                <Vote
                                    amountContributed={web3.utils.fromWei(
                                        amountContributed
                                    )}
                                    contractBalance={contractBalance}
                                    contract={contract}
                                    web3={web3}
                                    contributorCumulativeBalance={
                                        contributorCumulativeBalance
                                    }
                                />
                                <Withdraw className={'ml-4 mt-8'} />
                                <div className={'text-white ml-4 mt-8'}>
                                    <p>
                                        Tokens must be claimed before they can
                                        be withdrawn, even if they are unlocked.
                                    </p>
                                    <p>
                                        Bonus EGLs must be used to vote at least
                                        once to be withdrawn.
                                    </p>
                                    <p>
                                        These numbers are estimates and may be
                                        slightly off due to rounding.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {isPageWide && (
                        <div
                            style={{ width: '40%' }}
                            className={'flex justify-end items-center h-full'}
                        >
                            <div
                                style={{ zIndex: -1, right: '-10em' }}
                                className={
                                    'z-10 top-.5 right-.5 mr-156 absolute'
                                }
                            >
                                <img
                                    src={'grey.png'}
                                    width={'1000'}
                                    height={'1000'}
                                />
                            </div>

                            <SideFooter />
                        </div>
                    )}
                    <div style={{ width: '15%' }} className={'flex'} />
                </div>
            </main>
            {showClaimModal && (
                <ClaimModal
                    web3={web3}
                    walletAddress={walletAddress}
                    contract={contract}
                    handleOutsideClick={() => setModal(false)}
                />
            )}
        </GenericPage>
    )
}

export default () => (
    <Web3Container
        renderLoading={() => (
            <GenericPage connectWeb3={null} walletAddress={null}>
                <div
                    style={{ animation: `fadeIn 1s` }}
                    className='fixed inset-0 z-30 bg-black opacity-25'
                />
            </GenericPage>
        )}
        render={({ web3, accounts, contract }) => (
            <Index accounts={accounts} web3={web3} contract={contract} />
        )}
    />
)
