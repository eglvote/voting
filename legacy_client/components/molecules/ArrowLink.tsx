import React from 'react'
import Link from 'next/link'

interface ArrowLinkProps {
    style?: object
    className?: string
    children?: JSX.Element | JSX.Element[]
    href?: string
    title: string
    color?: string
}

export default function ArrowLink({
    style,
    className,
    href = '/',
    title,
    color,
}: ArrowLinkProps) {
    let imgSrc = '/static/arrowRightWhite.svg'

    if (color === 'babyBlue') imgSrc = '/static/arrowRightbabyBlue.svg'

    return (
        <Link href={href}>
            <div
                style={style}
                className={`${className} flex items-center hover:opacity-50 cursor-pointer`}
            >
                <p className={`mr-2 text-${color} text-xs font-bold`}>
                    {title}
                </p>
                <img width={'20px'} src={imgSrc} />
            </div>
        </Link>
    )
}
