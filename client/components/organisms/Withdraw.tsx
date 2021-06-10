import clsx from 'clsx'
import React from 'react'
import Button from '../atoms/Button'

interface WithdrawProps {
    style?: object
    className?: string
    children?: JSX.Element[] | JSX.Element
}

export default function Withdraw({
    style,
    className,
    children,
}: WithdrawProps) {
    return (
        <>
            <div className={`${className} flex flex-row`}>
                <div style={style} className={'w-96'}>
                    <p className={'text-3xl text-semibold text-white'}>
                        {'BPT Tokens Unlocked'}
                    </p>

                    <p
                        className={clsx(
                            'text-4xl text-semibold w-auto inline-blockfont-bold ',
                            'bg-clip-text text-transparent bg-gradient-to-r from-pink to-pink-dark'
                        )}
                    >
                        {'-'}
                    </p>
                    <p className={'text-xl text-semibold text-gray-400'}>
                        {'Unlock: ##/##/##-##/##/##'}
                    </p>
                </div>
                <div style={style} className={'w-96'}>
                    <p className={'text-3xl text-semibold text-white'}>
                        {'Bonus EGLs Unlocked'}
                    </p>

                    <p
                        className={clsx(
                            'text-4xl text-semibold w-auto inline-blockfont-bold ',
                            'bg-clip-text text-transparent bg-gradient-to-r from-pink to-pink-dark'
                        )}
                    >
                        {'-'}
                    </p>
                    <p className={'text-xl text-semibold text-gray-400'}>
                        {'Unlock: ##/##/##-##/##/##'}
                    </p>
                </div>
            </div>
            <div className={'flex justify-center w-full -ml-6 mt-4'}>
                <Button
                    className={clsx(
                        'bg-salmon hover:bg-salmon-dark hover:text-white w-28 h-12 rounded-2xl text-dark font-semibold -ml-12'
                    )}
                    handleClick={() => {}}
                >
                    <p className={'font-semibold'}>Withdraw</p>
                </Button>
            </div>
        </>
    )
}
