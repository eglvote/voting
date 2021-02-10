import React from 'react'
import NavBar from '../organisms/NavBar/NavBar'
import NavBarLink from '../organisms/NavBar/NavBarLink'
import Head from 'next/head'
import Footer from '../organisms/Footer'

interface connectWeb3Parameters {
    (): void
}

interface GenericPageTemplateProps {
    style?: object
    className?: string
    children?: JSX.Element[] | JSX.Element
    connectWeb3: connectWeb3Parameters
    walletAddress: string
    eglBalance: string
}

export default function GenericPageTemplate({
    style,
    className,
    children,
    connectWeb3 = () => {},
    walletAddress,
    eglBalance,
}: GenericPageTemplateProps) {
    return (
        <>
            <Head>
                <link rel="icon" sizes="32x32" href="/static/Logomark.svg" />
            </Head>
            <div style={style} className={`${className}`}>
                <NavBar
                    connectWeb3={connectWeb3}
                    walletAddress={walletAddress}
                    eglBalance={eglBalance}
                >
                    <NavBarLink href={'/vote'} name={'VOTE'} />
                    <NavBarLink href={'/claim'} name={'CLAIM'} />
                    <NavBarLink href={'/dapp'} name={'DAPP'} />
                    <NavBarLink href={'/status'} name={'STATUS'} />
                </NavBar>
                <div className={'mt-20 mb-32 h-full'}>{children}</div>
                <Footer />
            </div>
        </>
    )
}
