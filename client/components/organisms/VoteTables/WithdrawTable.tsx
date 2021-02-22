import React from 'react'
import { formatFromWei } from '../../../lib/helpers'

interface WithdrawTableProps {
    style?: object
    className?: string
    contract?: any
    tokensUnlocked: string
}
const Td = ({ children }) => (
    <td className={'text-left h-10 p-2'}>{children}</td>
)
const Th = ({ children }) => (
    <th className={'text-left text-white bg-babyBlue p-2'}>{children}</th>
)

export default function WithdrawTable({
    style,
    className,
    contract,
    tokensUnlocked,
}: WithdrawTableProps) {
    return (
        <div className={`${className} w-72 border rounded-xl`}>
            <table className={'w-full rounded-xl overflow-hidden p-4'}>
                <tr className={'w-full px-2'}>
                    <Th>EGLs Available for Withdrawal</Th>
                </tr>
                <tr className={'w-full bg-white'}>
                    <Td>{formatFromWei(tokensUnlocked) || '-'}</Td>
                </tr>
            </table>
        </div>
    )
}
