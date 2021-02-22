import React from 'react'
import { formatFromWei, displayComma } from '../../../lib/helpers'
import m from 'moment'

interface YourVoteTableProps {
    style?: object
    className?: string
    contract?: any
    tokensLocked: string
    releaseDate: any
    gasTarget: any
    lockupDuration: any
    voterReward: any
    lockupDate: any
}
const Td = ({ children }) => (
    <td className={'text-left h-10 p-2'}>{children}</td>
)
const Th = ({ children }) => (
    <th className={'text-left text-white bg-babyBlue p-2'}>{children}</th>
)

export default function YourVoteTable({
    style,
    className,
    contract,
    tokensLocked,
    releaseDate,
    gasTarget,
    lockupDuration,
    voterReward,
    lockupDate,
}: YourVoteTableProps) {
    return (
        <div className={'w-182 border rounded-xl'}>
            <table className={'w-full rounded-xl overflow-hidden p-4'}>
                <tr className={'w-full bg-babyBlue px-2'}>
                    <Th>Vote</Th>
                    <Th>EGL Locked</Th>
                    <Th>Lockup</Th>
                    <Th>Lock Date</Th>
                    <Th>Unlock Date</Th>
                    <Th>EGLs Awarded</Th>
                </tr>
                <tr className={'w-full bg-white'}>
                    <Td>{gasTarget || '-'}</Td>
                    <Td>{formatFromWei(tokensLocked) || '-'}</Td>
                    <Td>{lockupDuration || '-'}</Td>

                    <Td>
                        {m.unix(releaseDate).format('MM/DD/YY, h:mm:ss') || '-'}
                    </Td>
                    <Td>
                        {m.unix(lockupDate).format('MM/DD/YY, h:mm:ss') || '-'}
                    </Td>
                    <Td>
                        {displayComma(parseInt(voterReward).toFixed(3)) || '-'}
                    </Td>
                </tr>
            </table>
        </div>
    )
}
