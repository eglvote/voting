import React, { useEffect } from 'react'
import Router, { useRouter } from 'next/router'
import GenericPage from '../components/pageTemplates/GenericPage'
import connectToWeb3 from '../components/lib/connectToWeb3'
import useMediaQuery from '../components/hooks/UseMediaQuery'
import BigCountdown from '../components/organisms/BigCountdown'
import Event from '../components/molecules/AddToCalendar'
// import AddToCalendar from 'react-add-to-calendar'

const Begin = () => {
    let isPageWide = useMediaQuery('(min-width: 800px)')
    const router = useRouter()

    useEffect(() => {
        // router.push('/contribute')
    }, [])

    return (
        <GenericPage
            connectWeb3={() => connectToWeb3(window)}
            walletAddress={null}
            showWallet={false}
        >
            <main
                style={{
                    height: isPageWide ? '100vh' : '105vh',
                    width: isPageWide ? '100%' : '115vw',
                    zIndex: -2,
                    position: 'fixed',
                }}
                className='flex flex-row bg-dark'
            >
                <div className={'w-full'}>
                    <div
                        className={
                            'flex flex-col w-full justify-center items-center mt-16'
                        }
                    >
                        <h1
                            style={{ fontSize: '4em' }}
                            className={'text-white font-bold'}
                        >
                            $EGL Genesis.
                        </h1>
                    </div>
                    <div
                        className={
                            'flex flex-col w-full justify-center items-center mt-16'
                        }
                    >
                        <p
                            className={
                                'text-2xl inline-block font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink to-pink-dark'
                            }
                        >
                            LEARN MORE
                        </p>
                    </div>
                    <BigCountdown className={'mt-16'} />
                </div>
                <div
                    style={{ zIndex: -1, right: '-10em' }}
                    className={'z-10 top-.5 right-0 absolute'}
                >
                    <img src={'grey.png'} width={'1000'} height={'1000'} />
                </div>
            </main>
        </GenericPage>
    )
}

export default () => <Begin />
