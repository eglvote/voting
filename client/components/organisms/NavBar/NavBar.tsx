import React from 'react'
import Link from 'next/link'
import ConnectToWeb3Button from '../../molecules/ConnectToWeb3Button'
import NavBarLinkContainer from './NavBarLinkContainer'
// import Image from 'next/image'
import Card from '../../atoms/Card'
import { fromWei, displayComma } from '../../../lib/helpers'

const logo = '/static/Logomark.svg'

interface connectWeb3Parameters {
    (): void
}
interface NavBarProps {
    style?: object
    className?: string
    children?: JSX.Element | JSX.Element[]
    connectWeb3: connectWeb3Parameters
    walletAddress: string
    eglBalance: string
}

export default function NavBar({
    style,
    className,
    children,
    connectWeb3,
    walletAddress,
    eglBalance,
}: NavBarProps) {
    return (
        <header
            style={style}
            className={`${className} fixed inset-0 flex w-screen h-20 bg-hailStorm ${
                // window && window.scrollY && 'shadow'
                'shadow'
            }`}
        >
            <Link href={'/'}>
                <div
                    className={'cursor-pointer hover:opacity-50 w-28 m-2 ml-4'}
                >
                    <img src={logo} width={'65'} height={'65'} />
                </div>
            </Link>
            <NavBarLinkContainer>{children}</NavBarLinkContainer>
            <div className={'flex m-4 w-2/5 justify-end items-center'}>
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
