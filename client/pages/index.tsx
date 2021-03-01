import React from 'react'
import Button from '../components/atoms/Button'
import { useRouter } from 'next/router'
import Link from 'next/link'

const logo = '/static/LogomarkWhite.svg'
const pngImage = '/static/Logomark.svg'
const linkStyle = 'cursor-pointer hover:opacity-50 w-16'
const medium = '/static/medium.svg'
const twitter = '/static/twitter.svg'
const discord = '/static/discord.svg'
const github = '/static/github.svg'

export default function Index() {
    const router = useRouter()

    return (
        <div
            className={
                'flex justify-center items-center flex-col h-screen bg-dark text-white overflow-hidden'
            }
        >
            <div className={'absolute z-0 top-.5 left-0 -ml-32'}>
                <img src={pngImage} width={'1000'} height={'1000'} />
            </div>
            <div className={'z-10 -mr-96 p-4 rounded-xl bg-dark w-156'}>
                <div className={'mb-4'}>
                    <h3 className={'font-bold text-6xl'}>The Eagle Project</h3>
                    <h3 className={'mt-4'}>
                        The Eagle Project introduces a coordination utility,
                        EGL, for the Ethereum 1.x ecosystem to express it’s
                        collective desired gas limit, and incentivize pools to
                        follow this preference.
                    </h3>
                </div>

                <Button handleClick={() => router.push('/vote')}>
                    <div className={'flex flex-row items-center'}>
                        <img src={logo} width={'30'} height={'30'} />
                        <p className={'ml-2'}>Launch App</p>
                    </div>
                </Button>
                <div className={'flex items-center mt-8'}>
                    <Link href={'https://discord.com/'}>
                        <a target="_blank" rel="noreferrer">
                            <div className={linkStyle}>
                                <img src={discord} width={'30'} height={'30'} />
                            </div>
                        </a>
                    </Link>
                    <Link href={'https://github.com/'}>
                        <a target="_blank" rel="noreferrer">
                            <div className={linkStyle}>
                                <img src={github} width={'25'} height={'25'} />
                            </div>
                        </a>
                    </Link>
                    <Link href={'https://twitter.com/'}>
                        <a target="_blank" rel="noreferrer">
                            <div className={linkStyle}>
                                <img src={twitter} width={'25'} height={'25'} />
                            </div>
                        </a>
                    </Link>
                    <Link href={'https://medium.com/'}>
                        <a target="_blank" rel="noreferrer">
                            <div className={linkStyle}>
                                <img src={medium} width={'25'} height={'25'} />
                            </div>
                        </a>
                    </Link>
                </div>
            </div>
        </div>
    )
}
