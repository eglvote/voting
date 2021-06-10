import React from 'react'
import Button from '../atoms/Button'
import { withdrawLiquidityTokens } from '../../lib/contractMethods'
import { fromWei, displayComma } from '../../lib/helpers'

interface PoolTokenCardProps {
    style?: object
    className?: string
    contract: any
    walletAddress: string
    totalPoolTokens: string
    lockedPoolTokens: string
    unlockedPoolTokens: string
}

const Td = ({ children }) => <td className={'w-1/2 font-bold'}>{children}</td>

const TdEnd = ({ children }) => (
    <td className={'w-1/2 text-right'}>{children}</td>
)

export default function PoolTokenCard({
    style,
    className,
    contract,
    walletAddress,
    totalPoolTokens,
    lockedPoolTokens,
    unlockedPoolTokens,
}: PoolTokenCardProps) {
    return (
        <div
            style={style}
            className={`${className} w-80 p-5 rounded-xl bg-hailStorm`}
        >
            <table>
                <tr>
                    <Td>Total Pool Tokens</Td>
                    <TdEnd>
                        {displayComma(fromWei(totalPoolTokens)) || '-'}
                    </TdEnd>
                </tr>
                <tr>
                    <Td>Locked</Td>
                    <TdEnd>
                        {displayComma(fromWei(lockedPoolTokens)) || '-'}
                    </TdEnd>
                </tr>
                <tr>
                    <Td>Unlocked</Td>
                    <TdEnd>
                        {displayComma(fromWei(unlockedPoolTokens)) || '-'}
                    </TdEnd>
                </tr>
            </table>
            <div className={'mt-4 flex justify-center'}>
                <Button
                    handleClick={() =>
                        withdrawLiquidityTokens(contract, walletAddress)
                    }
                >
                    <p>WITHDRAW ALL UNLOCKED</p>
                </Button>
            </div>
        </div>
    )
}
