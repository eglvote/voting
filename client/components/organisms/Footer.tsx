import React from 'react'
import Link from 'next/link'

interface FooterProps {
    style?: object
    className?: string
    children?: JSX.Element | JSX.Element[]
}

const discord = '/static/discord.svg'
const github = '/static/github.svg'
const medium = '/static/medium.svg'
const twitter = '/static/twitter.svg'
const linkStyle = 'cursor-pointer hover:opacity-50 w-20'

export default function Footer({ style, className, children }: FooterProps) {
    return (
        <footer
            style={style}
            className={`${className} flex justify-center items-center bg-hailStorm shadow h-12 object-contain border static w-full bottom-0`}
        >
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
            <Link href={'https://medium.com/'}>
                <a target="_blank" rel="noreferrer">
                    <div className={linkStyle}>
                        <img src={medium} width={'25'} height={'25'} />
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
            <Link
                href={
                    'https://eglterms.s3-us-west-1.amazonaws.com/Terms+of+Service.pdf'
                }
            >
                <a target="_blank" rel="noreferrer">
                    <div className={linkStyle}>
                        <p className={'text-babyBlue'}>Terms</p>
                    </div>
                </a>
            </Link>
        </footer>
    )
}
