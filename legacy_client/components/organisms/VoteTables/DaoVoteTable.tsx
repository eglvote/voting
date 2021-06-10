import React from 'react'
import { formatBigNumberAttribute } from '../../../lib/helpers'

interface DaoVoteTableProps {
    style?: object
    className?: string
    amount: string
    walletAddress: string
}

const Td = ({ children }) => (
    <td className={'text-left text-xs h-10 p-2 px-4'}>{children}</td>
)

const Th = ({ children }) => (
    <th
        className={
            'text-left text-white bg-babyBlue p-2 px-4 text-sm font-normal'
        }
    >
        {children}
    </th>
)

export default function DaoVoteTable({
    style,
    className,
    amount,
    walletAddress,
}: DaoVoteTableProps) {
    return (
        <div style={style} className={`${className} border rounded`}>
            <table className={'w-full rounded overflow-hidden p-4'}>
                <tr className={'w-full px-2'}>
                    <Th>EGL Amount</Th>
                    <Th>Wallet Address</Th>
                </tr>
                <tr className={'w-full bg-white'}>
                    <Td>
                        {amount != '0' ? formatBigNumberAttribute(amount) : '-'}
                    </Td>
                    <Td>{walletAddress !== '0' ? walletAddress : '-'}</Td>
                </tr>
            </table>
        </div>
    )
}
