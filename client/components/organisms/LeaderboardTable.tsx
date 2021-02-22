import React from 'react'
import { formatFromWei, truncateEthAddress } from '../../lib/helpers'

interface LeaderboardTableProps {
    style?: object
    className?: string
    contract?: any
    walletAddress?: string
    totalPoolTokens?: any
    lockedPoolTokens?: any
    unlockedPoolTokens?: any
    seedAccounts?: any
}
const Td = ({ children }) => <td className={'text-left h-10'}>{children}</td>
const Th = ({ children }) => <th className={'text-left'}>{children}</th>

export default function LeaderboardTable({
    style,
    className,
    contract,
    seedAccounts,
}: LeaderboardTableProps) {
    const arr = [...new Array(10)]

    return (
        <div className={'w-full p-8 rounded-xl bg-white border'}>
            <h1 className={'text-salmon text-2xl font-bold mb-4'}>
                Leaderboard - Current Votes
            </h1>
            <table className={'w-full'}>
                <tr className={'w-full'}>
                    <Th>Address</Th>
                    <Th>Name</Th>
                    <Th>EGLs Voting</Th>
                    <Th>Vote</Th>
                    <Th>Weeks Locked</Th>
                    <Th>EGL Seed*</Th>
                </tr>
                {seedAccounts.map((seedAccount) => {
                    return (
                        <tr className={'w-full'}>
                            <Td>
                                {truncateEthAddress(
                                    seedAccount.account.returnValues.seedAddress
                                )}
                            </Td>
                            <Td>?</Td>
                            <Td>{formatFromWei(seedAccount.tokensLocked)}</Td>
                            <Td>{seedAccount.gasTarget}</Td>
                            <Td>{seedAccount.lockupDuration}</Td>
                            <Td>Yes</Td>
                        </tr>
                    )
                })}
            </table>
        </div>
    )
}
