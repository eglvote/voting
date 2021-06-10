import React from 'react'
import ConnectToWeb3Button from '../../molecules/ConnectToWeb3Button'
import NavBarLinkContainer from './NavBarLinkContainer'
import Card from '../../atoms/Card'
import { fromWei, displayComma } from '../../../lib/helpers'
import HamburgerMenu from '../Hamburger/HamburgerMenu'
import NavBarLink from './NavBarLink'
import useMediaQuery from '../../hooks/UseMediaQuery'
import Link from 'next/link'
import { NavBarLinks } from '../../../lib/constants'

interface connectWeb3Parameters {
    (): void
}

interface NavBarProps {
    style?: object
    className?: string
    connectWeb3: connectWeb3Parameters
    walletAddress: string
    eglBalance: string
}

export default function NavBar({
    style,
    className,
    connectWeb3,
    walletAddress,
    eglBalance,
}: NavBarProps) {
    let isPageWide = useMediaQuery('(min-width: 1100px)')

    return (
        <header
            style={style}
            className={`${className} fixed inset-0 flex w-screen h-20 bg-hailStorm shadow`}
        >
            {isPageWide ? (
                <>
                    <Link href={'/'}>
                        <div
                            className={
                                'cursor-pointer hover:opacity-50 m-2 mx-4'
                            }
                        >
                            <img
                                src={'/static/Logomark.svg'}
                                style={{
                                    minWidth: '65px',
                                }}
                            />
                        </div>
                    </Link>
                    <NavBarLinkContainer>
                        {NavBarLinks.map((link) => {
                            return <NavBarLink name={link} />
                        })}
                    </NavBarLinkContainer>
                </>
            ) : (
                <HamburgerMenu links={NavBarLinks} />
            )}
            <div className={'flex m-4 w-full justify-end items-center'}>
                <Card className={'bg-salmon shadow h-12 mr-4 min-w-max'}>
                    <p className={'text-white text-center font-bold'}>{`${
                        eglBalance ? displayComma(fromWei(eglBalance)) : 0
                    } EGL`}</p>
                </Card>
                <ConnectToWeb3Button
                    connectWeb3={connectWeb3}
                    walletAddress={walletAddress}
                />
            </div>
        </header>
    )
}
