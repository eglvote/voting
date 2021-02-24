import React from 'react'
import { truncateEthAddress } from '../../../lib/helpers'

interface DaoTableProps {
    style?: object
    className?: string
    contract?: any
    daoAmount: string
    daoRecipient: string
    upgradeAddress: string
}
const Td = ({ children }) => (
    <td className={'text-left h-10 p-2'}>{children}</td>
)
const Th = ({ children }) => (
    <th className={'text-left p-2 w-32 font-normal text-sm bg-hailStorm-dark'}>
        {children}
    </th>
)

export default function DaoTable({
    style,
    className,
    contract,
    daoAmount,
    daoRecipient,
    upgradeAddress,
}: DaoTableProps) {
    return (
        <div className={'w-96 rounded'}>
            <table className={'w-full rounded overflow-hidden p-4'}>
                <tr className={'w-full px-2'}>
                    <Th>Dao Vote</Th>
                    <Th>Dao Amount</Th>
                    <Th>Contract Upgrade</Th>
                </tr>
                <tr className={'w-full bg-white'}>
                    <Td>{daoAmount != '0' ? daoAmount : '-'}</Td>
                    <Td>{truncateEthAddress(daoRecipient)}</Td>
                    <Td>{truncateEthAddress(upgradeAddress)}</Td>
                </tr>
            </table>
        </div>
    )
}
