import React, { useEffect, useState } from 'react'
import GenericPage from '../components/pageTemplates/GenericPage'
import BodyHeader from '../components/molecules/BodyHeader'
import SideFooter from '../components/organisms/SideFooter'
import Countdown from '../components/organisms/Countdown'
import TotalStaked from '../components/organisms/TotalStaked'
import ParticipateModal from '../components/organisms/ParticipateModal'
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
                            {!ended ? (
                                <>
                                    <Countdown className={'ml-4 mt-32'} />
                                    <TotalStaked
                                        cumulativeBalance={cumulativeBalance}
                                        onClickJoin={() => setModal(true)}
                                        className={'ml-4 mt-20'}
                                        hasContributed={hasContributed}
                                        walletAddress={walletAddress}
                                        ended={ended}
                                    />
                                </>
                            ) : (
                                <div className={'mt-16'}>
                                    {walletAddress && (
                                        <>
                                            <TotalStaked
                                                cumulativeBalance={
                                                    cumulativeBalance
                                                }
                                                onClickJoin={() =>
                                                    setModal(true)
                                                }
                                                className={'ml-4 mt-20'}
                                                hasContributed={hasContributed}
                                                walletAddress={walletAddress}
                                                ended={ended}
                                            />
                                            <div
                                                className={
                                                    'text-white ml-4 mt-8 text-xl'
                                                }
                                            >
                                                <p>The Genesis has closed.</p>
                                                {walletAddress ? (
                                                    <p>
                                                        Please check Discord for
                                                        updates.
                                                    </p>
                                                ) : (
                                                    <>
                                                        <p>
                                                            Please connect your
                                                            wallet to see your
                                                            participation.
                                                        </p>
                                                        <button
                                                            className={clsx(
                                                                'rounded-xl mr-10 h-12 font-semibold w-96 mt-8',
                                                                'text-center px-4 py-2 transition duration-500',
                                                                'w-32 border-2 border-salmon text-salmon',
                                                                'hover:bg-salmon hover:border-white hover:text-white'
                                                            )}
                                                        >
                                                            <p
                                                                className={
                                                                    'font-semibold'
                                                                }
                                                            >
                                                                App
                                                            </p>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            {hasContributed && !ended && (
                                <div className={'text-white ml-4 mt-8 text-xl'}>
                                    <p>Thank you for your participation!</p>
                                    <p>
                                        Addresses can only participate once in
                                        the Genesis.
                                    </p>
                                    <p>
                                        If you'd like to participate again,
                                        please use another wallet.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    {isPageWide && (
                        <div
                            style={{ width: '40%' }}
                            className={'flex justify-end items-center h-full'}
                        >
                            {ended ? (
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
                            ) : (
                                <div
                                    className={
                                        'h-full flex items-start -mt-10 w-full justify-center'
                                    }
                                >
                                    <img
                                        width={'300'}
                                        src={
                                            hasContributed
                                                ? 'eggCracked.png'
                                                : 'egg.png'
                                        }
                                        className={'mt-32'}
                                    />
                                </div>
                            )}
                            <SideFooter />
                        </div>
                    )}
                    <div style={{ width: '15%' }} className={'flex'} />
                </div>
            </main>
            {modal && (
                <ParticipateModal
                    web3={web3}
                    walletAddress={walletAddress}
                    contract={contract}
                    handleOutsideClick={() => setModal(false)}
                />
            )}
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
