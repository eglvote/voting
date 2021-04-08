import React from 'react'
import { fromWei, truncateEthAddress } from '../../../lib/helpers'
import m from 'moment'

interface voteParams {
    date: string
    candidate: string
    percentage: string
    status: string
}

interface PastContractVotesTableProps {
    style?: object
    className?: string
    pastVotes?: voteParams[]
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

export default function PastContractVotesTable({
    style,
    className,
    pastVotes,
}: PastContractVotesTableProps) {
    return (
        <div style={style} className={`${className} border rounded w-144`}>
            <table className={'w-full rounded overflow-hidden p-4'}>
                <tr className={'w-full px-2'}>
                    <Th>{'Epoch Date'}</Th>
                    <Th>{'Contract Address'}</Th>
                    <Th>{'% Vote'}</Th>
                    <Th>{'Status'}</Th>
                </tr>
                {pastVotes.map((vote) => (
                    <tr className={'w-full bg-white'}>
                        <Td>
                            {vote.date !== '0'
                                ? m.unix(Number(vote.date)).format('MM.DD.YY')
                                : '-'}
                        </Td>
                        <Td>
                            {vote.candidate
                                ? truncateEthAddress(vote.candidate)
                                : '-'}
                        </Td>
                        <Td>
                            {vote.percentage !== '0'
                                ? `${fromWei(vote.percentage)}%`
                                : '-'}
                        </Td>
                        <Td>{vote.status ? vote.status : '-'}</Td>
                    </tr>
                ))}
            </table>
        </div>
    )
}
