import React from 'react'
import ArrowLink from '../molecules/ArrowLink'

interface NestedBoxProps {
    style?: object
    className?: string
    children?: JSX.Element | JSX.Element[]
    nestedColor?: string
    title: string
    arrowLink?: boolean
    href?: string
}

export default function NestedBox({
    style,
    className,
    children,
    nestedColor,
    title,
    arrowLink,
    href,
}: NestedBoxProps) {
    return (
        <div
            style={style}
            className={`${className} w-80 h-32 bg-babyBlue rounded-xl p-2 ${
                arrowLink ? 'pb-2' : 'pb-4'
            } px-4 flex items-end flex-col`}
        >
            <div className={'w-full mb-2'}>
                <h1 className={'text-white font-sm text-center'}>{title}</h1>
            </div>
            <div className={'h-3/4 w-full flex items-end'}>
                <div
                    className={`flex h-full flex-col w-full p-2 justify-center items-center ${
                        nestedColor ? nestedColor : 'bg-babyBlue-light'
                    } rounded`}
                >
                    {children}
                </div>
            </div>
            {arrowLink && (
                <div className={'w-full flex justify-end'}>
                    <ArrowLink color={'white'} title={'MORE'} href={href} />
                </div>
            )}
        </div>
    )
}
