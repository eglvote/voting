import React from 'react'
import { formatFromWei } from '../../../lib/helpers'
import m from 'moment'

interface ClaimTableProps {
    style?: object
    className?: string
    date: string
    releaseDate: string
    ethSent: string
    poolTokens: string
    locked: string
    unlocked: string
}

const Td = ({ children }) => (
    <td className={'text-left h-10 p-2 px-4'}>{children}</td>
)
const Th = ({ children }) => (
    <th
        className={
            'text-left text-white bg-babyBlue p-2 px-4 w-24 font-normal text-sm'
        }
    >
        {children}
    </th>
)

export default function ClaimTable({
    style,
    className,
    date = '0',
    releaseDate = '0',
    ethSent = '0',
    poolTokens = '0',
    locked = '0',
    unlocked = '0',
}: ClaimTableProps) {
    return (
        <div style={style} className={`${className} border rounded`}>
            <table className={'w-full rounded overflow-hidden p-4'}>
                <tr className={'w-full bg-babyBlue px-2'}>
                    <Th>Date</Th>
                    <Th>Release Date</Th>
                    <Th>ETH Sent</Th>
                    <Th>ETH-EGL Pool Tokens</Th>
                    <Th>Locked</Th>
                    <Th>Unlocked</Th>
                </tr>
                <tr className={'w-full bg-white'}>
                    <Td>
                        {date != '0'
                            ? m.unix(Number(date)).format('MM.DD.YY')
                            : '-'}
                    </Td>
                    <Td>{releaseDate != '0' ? releaseDate : '-'}</Td>
                    <Td>{ethSent != '0' ? formatFromWei(ethSent) : '-'}</Td>
                    <Td>
                        {poolTokens != '0' ? formatFromWei(poolTokens) : '-'}
                    </Td>
                    <Td>{locked != '0' ? formatFromWei(locked) : '-'}</Td>
                    <Td>{unlocked != '0' ? unlocked : '-'}</Td>
                </tr>
            </table>
        </div>
    )
}
