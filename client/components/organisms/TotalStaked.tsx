import clsx from 'clsx'
import React from 'react'
import Button from '../atoms/Button'

interface TotalStakedProps {
    style?: object
    className?: string
    children?: JSX.Element[] | JSX.Element
    onClickJoin: Function
    cumulativeBalance: string
    hasContributed: boolean
    walletAddress?: string
    ended: boolean
}

export default function TotalStaked({
    style,
    className,
    children,
    cumulativeBalance,
    onClickJoin,
    hasContributed,
    walletAddress,
    ended,
}: TotalStakedProps) {
    return (
        <div className={`${className} flex flex-row`}>
            <div style={style} className={'text-white'}>
                <p
                    className={clsx(
                        'text-4xl text-semibold w-auto inline-blockfont-bold text-right',
                        'bg-clip-text text-transparent bg-gradient-to-r from-pink to-pink-dark'
                    )}
                >
                    {cumulativeBalance}
                </p>
                <p className={'text-3xl text-semibold'}>{'Total ETH Staked'}</p>
            </div>
            {!hasContributed && walletAddress && !ended && (
                <div className={'ml-24 flex items-center'}>
                    <Button
                        handleClick={() => onClickJoin()}
                        className={
                            'bg-salmon hover:bg-salmon-dark hover:text-white w-28 h-12 rounded-2xl text-dark'
                        }
                    >
                        <p className={'text-2xl font-semibold'}>JOIN</p>
                    </Button>
                </div>
            )}
        </div>
    )
}
