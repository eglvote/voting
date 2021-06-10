import React from 'react'
import Link from 'next/link'

interface SideFooterProps {
    style?: object
    className?: string
    children?: JSX.Element[] | JSX.Element
}

interface ImgProps {
    src: string
    width?: string
    href: string
}

const Img = ({ src, width, href }: ImgProps) => (
    <Link href={href}>
        <a target='_blank' rel='noreferrer'>
            <img
                className={'my-2 text-white cursor-pointer hover:opacity-50'}
                width={width || '27px'}
                src={src}
            />
        </a>
    </Link>
)

const Line = ({ className }) => (
    <div className={`${className} border-l-2 border-white h-1/4`} />
)

export default function SideFooter({
    style,
    className,
    children,
}: SideFooterProps) {
    return (
        <div
            style={style}
            className={`${className} flex flex-col items-center justify-center h-full -mt-16`}
        >
            <Line className={'mb-8'} />

            <Img
                width={'35px'}
                src={'discord.svg'}
                href={'https://discord.gg/5TP84xk535'}
            />

            <Img src={'github.svg'} href={''} />
            <h1
                onClick={() =>
                    window.open(
                        'https://eglterms.s3-us-west-1.amazonaws.com/Terms+of+Service.pdf',
                        '_blank'
                    )
                }
                className={'my-2 text-white cursor-pointer hover:opacity-50'}
            >
                Terms
            </h1>
            <Img src={'medium.svg'} href={'https://medium.com/@eglvote'} />
            <Img src={'twitter.svg'} href={'https://twitter.com/ETH_EGL'} />
            <Line className={'mt-8'} />
        </div>
    )
}
