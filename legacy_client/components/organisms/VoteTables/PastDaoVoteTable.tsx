import React from 'react'
import { formatBigNumberAttribute, fromWei } from '../../../lib/helpers'
import m from 'moment'
import useMediaQuery from '../../hooks/UseMediaQuery'

interface Vote {
    date: number
    candidateAmountSum: string
    candidate: string
    percentage: string
    status: string
}

interface PastDaoVoteTableProps {
    style?: object
    className?: string
    pastVotes: Vote[]
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

export default function PastDaoVoteTable({
    style,
    className,
    pastVotes,
}: PastDaoVoteTableProps) {
    let isPageWide = useMediaQuery('(min-width: 1100px)')

    return (
        <>
            {isPageWide ? (
                <div style={style} className={`${className} border rounded`}>
                    <table className={'w-full rounded overflow-hidden p-4'}>
                        <tr className={'w-full px-2'}>
                            <Th>Date</Th>
                            <Th>EGL Amount</Th>
                            <Th>Wallet Address</Th>
                            <Th>Round 1</Th>
                            <Th>Status</Th>
                            <Th>Round 2</Th>
                            <Th>Status</Th>
                        </tr>
                        {pastVotes.map((vote) => (
                            <tr className={'w-full bg-white'}>
                                <Td>
                                    {String(vote.date) !== '0'
                                        ? m.unix(vote.date).format('MM.DD.YY')
                                        : '-'}
                                </Td>
                                <Td>
                                    {vote.candidateAmountSum != '0'
                                        ? formatBigNumberAttribute(
                                              vote.candidateAmountSum
                                          )
                                        : '-'}
                                </Td>
                                <Td>{vote.candidate ? vote.candidate : '-'}</Td>
                                <Td>
                                    {vote.percentage !== '0'
                                        ? `${fromWei(vote.percentage)}%`
                                        : '-'}
                                </Td>
                                <Td>
                                    {vote.status !== null
                                        ? vote.status
                                            ? 'Passed'
                                            : 'Failed'
                                        : '-'}
                                </Td>
                                <Td>-</Td>
                                <Td>-</Td>
                            </tr>
                        ))}
                    </table>
                </div>
            ) : (
                <>
                    <div
                        style={style}
                        className={`${className} border rounded`}
                    >
                        <table className={'w-full rounded overflow-hidden p-4'}>
                            <tr className={'w-full px-2'}>
                                <Th>Date</Th>
                                <Th>EGL Amount</Th>
                                <Th>Wallet Address</Th>
                            </tr>
                            {pastVotes.map((vote) => (
                                <tr className={'w-full bg-white'}>
                                    <Td>
                                        {String(vote.date) !== '0'
                                            ? m
                                                  .unix(vote.date)
                                                  .format('MM.DD.YY')
                                            : '-'}
                                    </Td>
                                    <Td>
                                        {vote.candidateAmountSum != '0'
                                            ? formatBigNumberAttribute(
                                                  vote.candidateAmountSum
                                              )
                                            : '-'}
                                    </Td>
                                    <Td>
                                        {vote.candidate ? vote.candidate : '-'}
                                    </Td>
                                </tr>
                            ))}
                        </table>
                    </div>
                    <div>
                        <table
                            className={
                                'w-full rounded overflow-hidden p-4 mt-4'
                            }
                        >
                            <tr className={'w-full px-2'}>
                                <Th>Round 1</Th>
                                <Th>Status</Th>
                                <Th>Round 2</Th>
                                <Th>Status</Th>
                            </tr>
                            {pastVotes.map((vote) => (
                                <tr className={'w-full bg-white'}>
                                    <Td>
                                        {vote.percentage !== '0'
                                            ? `${fromWei(vote.percentage)}%`
                                            : '-'}
                                    </Td>
                                    <Td>
                                        {vote.status !== null
                                            ? vote.status
                                                ? 'Passed'
                                                : 'Failed'
                                            : '-'}
                                    </Td>
                                    <Td>-</Td>
                                    <Td>-</Td>
                                </tr>
                            ))}
                        </table>
                    </div>
                </>
            )}
        </>
    )
}
