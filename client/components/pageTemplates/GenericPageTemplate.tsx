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
                    <NavBarLink href={'/launch'} name={'LAUNCH'} />
                    <NavBarLink href={'/dao'} name={'DAO'} />
                    <NavBarLink href={'/status'} name={'STATUS'} />
                </NavBar>
                <div className={'mt-20 h-full'}>{children}</div>
                <Footer />
            </div>
        </>
    )
}
