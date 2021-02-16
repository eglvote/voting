import React from 'react'
import Button from '../components/atoms/Button'
// import Image from 'next/image'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Footer from '../components/organisms/Footer'

const logo = '/static/LogomarkWhite.svg'
const pngImage = '/static/Logomark.svg'

const U = ({ children }: any) => (
    <span className={'border-b-4'}>{children}</span>
)

export default function Index() {
    const router = useRouter()

    return (
        <>
            <Head>
                <link rel="icon" sizes="32x32" href="/static/Logomark.svg" />
            </Head>
            <div
                className={
                    'flex justify-center items-center flex-col bg-dark h-screen text-white'
                }
            >
                <div className={'absolute z-0 top-.5 left-0 -ml-32'}>
                    <img src={pngImage} width={'1000'} height={'1000'} />
                </div>
                <div className={'z-10 -mr-64 p-4 rounded-xl bg-dark'}>
                    <div className={'mb-10'}>
                        <h1>A fully decentralized protocol to influence the</h1>
                        <h1 className={'font-bold text-6xl'}>
                            Ethereum Gas Limit
                        </h1>
                    </div>

                    <Button handleClick={() => router.push('/vote')}>
                        <div className={'flex flex-row items-center'}>
                            <img src={logo} width={'30'} height={'30'} />
                            <p className={'ml-2'}>Launch App</p>
                        </div>
                    </Button>
                </div>
            </div>
            <div className={'h-screen p-20 flex justify-center'}>
                <div className={'w-4/5 mt-32'}>
                    <div className={'flex flex-row'}>
                        <div className={'w-1/2'}>
                            <div style={{ width: '30em' }}>
                                <div className={'border-b-2 border-babyBlue'}>
                                    <h1 className={'text-2xl text-babyBlue'}>
                                        What is EGL?
                                    </h1>
                                </div>
                                <div>
                                    <p>
                                        The EGL token is a governance token to
                                        influence the ETH Gas Limit.
                                    </p>
                                    <p className={'mt-4'}>
                                        EGL holders vote whether to increase,
                                        decrease, or keep the current gas limit,
                                        and Ethereum miners are incentivized to
                                        follow the vote to collect free EGLs.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className={'w-1/2 flex justify-end'}>
                            <img
                                style={{ width: '35em' }}
                                src={'static/same.png'}
                            />
                        </div>
                    </div>
                    <div className={'flex flex-row mt-16'}>
                        <div className={'w-1/2 flex justify-start'}>
                            <img
                                style={{ width: '25em' }}
                                src={'static/ethbox.png'}
                            />
                        </div>
                        <div className={'w-1/2 flex justify-end items-center'}>
                            <div>
                                <div className={'border-b-2 border-babyBlue'}>
                                    <h1 className={'text-2xl text-babyBlue'}>
                                        Why do we need EGL?
                                    </h1>
                                </div>
                                <div>
                                    <p>
                                        The gas limit effectively controls the
                                        block size and thus the number of
                                        transactions Ethereum can process (i.e.
                                        ups). When demand for the limit block
                                        space increases, gas fees spike as users
                                        outbid each other to fit inside of the
                                        block.
                                    </p>
                                    <p className={'mt-4'}>
                                        The gas limit is set by Ethereum miners,
                                        without taking into consideration the
                                        wishes of the Ethereum community. EGL
                                        creates an economic incentive for
                                        Ethereum miners to set the gas limit in.
                                        Line with EGL holder’s desires.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={'h-screen border p-20 mb-32'}>
                <h1 className={'text-4xl font-bold'}>How EGL Works:</h1>
                <img className={'w-full'} src={'static/4.png'}></img>
            </div>
            <div className={'h-screen bg-hailStorm p-20'}>
                <h1 className={'text-4xl font-bold'}>Helpful Links</h1>
                <div className={'flex'}>
                    <div className={'m-4'}>
                        <div className={'w-96 h-72 bg-white'} />
                        <h1 className={'text-2xl'}>EGL Launch</h1>
                    </div>
                    <div className={'m-4'}>
                        <div className={'w-96 h-72 bg-white'} />
                        <h1 className={'text-2xl'}>Voting</h1>
                    </div>
                    <div className={'m-4'}>
                        <div className={'w-96 h-72 bg-white'} />
                        <h1 className={'text-2xl'}>DAO</h1>
                    </div>
                </div>
                <div className={'w-4/5'}>
                    <h1 className={'mt-16 text-4xl font-bold'}>
                        Frequently Asked Questions
                    </h1>
                    <div className={'flex border-b-2 border-grey-500 mt-4'}>
                        <div className={'w-2/5'}>
                            <h1 className={'text-2xl'}>
                                How do you claim EGLs?
                            </h1>
                        </div>
                        <div className={'flex justify-end w-3/5'}>
                            <img
                                className={'w-8 m-1'}
                                src={'static/plus.svg'}
                            />
                        </div>
                    </div>
                    <div className={'flex border-b-2 border-grey-500 mt-4'}>
                        <div className={'w-2/5'}>
                            <h1 className={'text-2xl'}>How do you vote?</h1>
                        </div>
                        <div className={'flex justify-end w-3/5'}>
                            <img
                                className={'w-8 m-1'}
                                src={'static/plus.svg'}
                            />
                        </div>
                    </div>
                    <div className={'flex border-b-2 border-grey-500 mt-4'}>
                        <div className={'w-2/5'}>
                            <h1 className={'text-2xl'}>
                                Why would miners listen to EGL holders?
                            </h1>
                        </div>
                        <div className={'flex justify-end w-3/5'}>
                            <img
                                className={'w-8 m-1'}
                                src={'static/plus.svg'}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}
