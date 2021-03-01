import React from 'react'

interface ArrowLinkProps {
    style?: object
    className?: string
    children?: JSX.Element | JSX.Element[]
    title: string
    color?: boolean
}

export default function ArrowLink({
    style,
    className,
    title,
    color,
}: ArrowLinkProps) {
    return (
        <div
            style={style}
            className={`${className} flex items-center hover:opacity-50 cursor-pointer`}
        >
            <p
                className={`mr-2 text-${
                    color ? 'babyBlue' : 'Black'
                } text-xs font-bold`}
            >
                {title}
            </p>
            <img
                width={'20px'}
                src={`/static/arrowRight${color ? 'Blue' : 'Black'}.svg`}
            />
        </div>
    )
}
