import React from 'react'
import { formatFromWei } from '../../../lib/helpers'

interface WithdrawTableProps {
    style?: object
    className?: string
    contract?: any
    tokensUnlocked: string
}
const Td = ({ children }) => (
    <td className={'text-left h-10 p-2 px-4'}>{children}</td>
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

export default function WithdrawTable({
    style,
    className,
    contract,
    tokensUnlocked,
}: WithdrawTableProps) {
    return (
        <div className={`${className} w-72 border rounded`}>
            <table className={'w-full rounded overflow-hidden p-4'}>
                <tr className={'w-full px-2'}>
                    <Th>Unlocked EGLs</Th>
                </tr>
                <tr className={'w-full bg-white'}>
                    <Td>
                        {tokensUnlocked != '0'
                            ? formatFromWei(tokensUnlocked)
                            : '-'}
                    </Td>
                </tr>
            </table>
        </div>
    )
}
