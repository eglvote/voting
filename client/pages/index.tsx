import React from 'react'
import Button from '../components/atoms/Button'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Head from 'next/head'

const logo = '/static/LogomarkWhite.svg'
const pngImage = '/static/Logomark.svg'

const U = ({ children }: any) => (
    <span className={'border-b-4'}>{children}</span>
)

export default () => {
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
                <div className={'fixed z-0 top-.5 left-0 -ml-72'}>
                    <Image src={pngImage} width={'1000'} height={'1000'} />
                </div>
                <div className={'-mr-72 z-10'}>
                    <div className={'mb-10'}>
                        <h1>A fully decentralized protocol to influence the</h1>
                        <h1 className={'font-bold text-6xl'}>
                            <U>E</U>thereum <U>G</U>as <U>L</U>imit
                        </h1>
                    </div>

                    <Button handleClick={() => router.push('/vote')}>
                        <div className={'flex flex-row items-center'}>
                            <Image src={logo} width={'30'} height={'30'} />
                            <p className={'ml-2'}>Launch App</p>
                        </div>
                    </Button>
                </div>
            </div>
        </>
    )
}
