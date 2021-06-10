import React from 'react'
import ConnectToWeb3Button from '../molecules/ConnectToWeb3Button'
import NavbarLinkContainer from './NavbarLinkContainer'
import NavbarLink from './NavbarLink'
import useMediaQuery from '../hooks/UseMediaQuery'
import Link from 'next/link'
import clsx from 'clsx'

interface connectWeb3Parameters {
    (): void
}

interface NavBarProps {
    style?: object
    className?: string
    connectWeb3: connectWeb3Parameters
    walletAddress: string
    showWallet: boolean
}

export default function NavBar({
    style,
    className,
    connectWeb3,
    walletAddress,
    showWallet = true,
}: NavBarProps) {
    let isPageWide = useMediaQuery('(min-width: 800px)')

    return (
        <header
            style={{ ...style, width: isPageWide ? '100%' : '115vw' }}
            className={`${className} inset-0 flex flex-row h-20 bg-dark justify-center`}
        >
            <div
                style={{ width: isPageWide ? '80%' : '100%' }}
                className={'flex flex-row'}
            >
                <Link href={'/'}>
                    <div
                        style={{ width: '20%' }}
                        className={clsx(
                            'cursor-pointer hover:opacity-50 flex flex-direction-row justify-start ml-4'
                        )}
                    >
                        <img
                            src={'egl.svg'}
                            style={{
                                width: '130px',
                            }}
                        />
                    </div>
                </Link>
                <div
                    style={{
                        width: isPageWide ? '60%' : '40%',
                        marginLeft: '-3.5vw',
                    }}
                    className={clsx(
                        'flex flex-row justify-center items-center'
                    )}
                >
                    {isPageWide && (
                        <NavbarLinkContainer>
                            <NavbarLink name={'Genesis'} />
                            <NavbarLink name={'Vote'} />
                            {/* <NavbarLink name={'Docs'} /> */}
                            <NavbarLink name={'Forum'} />
                            {/* <NavbarLink name={'FAQ'} /> */}
                            <Link href={'/pregen'}>
                                <div
                                    className={
                                        'flex flex-col items-center justify-top cursor-pointer h-full hover:opacity-50'
                                    }
                                >
                                    <a
                                        style={style}
                                        className={`${className} m-4 font-semibold text-white text-xl`}
                                    >
                                        {'Counter'}
                                    </a>
                                </div>
                            </Link>
                        </NavbarLinkContainer>
                    )}
                </div>
                <div
                    style={{
                        width: isPageWide ? '20%' : '40%',
                        // marginLeft: '-3.5vw',
                    }}
                    className={`flex items-center justify-end
                        // isPageWide ? '-ml-8' : 'ml-0'
                    `}
                >
                    {showWallet && (
                        <ConnectToWeb3Button
                            connectWeb3={connectWeb3}
                            walletAddress={walletAddress}
                        />
                    )}
                </div>
            </div>
        </header>
    )
}
