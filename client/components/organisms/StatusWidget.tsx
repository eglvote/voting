import React from 'react'
import { fromWei, displayComma } from '../../lib/helpers'
import m from 'moment'
import LabelCard from '../molecules/LabelCard'
import SmartButton from '../molecules/SmartButton'

interface StatusWidgetProps {
    style?: object
    className?: string
    contract: any
    token: any
    walletAddress: string
    tokensLocked: string
    releaseDate: any
    gasTarget: any
    lockupDuration: any
    voterReward: any
    lockupDate: any
    tokensUnlocked: string
    noAllowance: boolean
    hasVoted: boolean
    canWithdraw: boolean
    openVoteModal: any
    openRevoteModal: any
}

const Th = ({ children }) => <th className={'w-32'}>{children}</th>
const Td = ({ children }) => <td className={'w-32 text-center'}>{children}</td>

export default function StatusWidget({
    style,
    className,
    contract,
    token,
    walletAddress,
    tokensLocked,
    releaseDate,
    gasTarget,
    lockupDuration,
    voterReward,
    lockupDate,
    tokensUnlocked,
    noAllowance,
    hasVoted,
    canWithdraw,
    openVoteModal,
    openRevoteModal,
}: StatusWidgetProps) {
    return (
        <div className={`${className}`}>
            <div className={'flex flex-row items-end'}>
                <div>
                    <div className={'flex justify-center items-center'}>
                        <table className="table-auto">
                            <thead>
                                <tr>
                                    <Th>Lock Date</Th>
                                    <Th>Weeks Locked</Th>
                                    <Th>Unlock Date</Th>
                                    <Th>Vote</Th>
                                    <Th>EGLs Locked</Th>
                                    <Th>EGLs Awarded</Th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                    <div
                        className={
                            'flex justify-center items-center bg-hailStorm rounded-xl h-20 mt-4 px-8'
                        }
                    >
                        <table className="table-auto">
                            <tbody>
                                <tr>
                                    <Td>
                                        {lockupDate > 0
                                            ? m
                                                  .unix(lockupDate)
                                                  .format('MM/DD/YY, h:mm:ss')
                                            : '-'}
                                    </Td>
                                    <Td>
                                        {lockupDuration > 0
                                            ? lockupDuration
                                            : '-'}
                                    </Td>
                                    <Td>
                                        {releaseDate > 0
                                            ? m
                                                  .unix(releaseDate)
                                                  .format('MM/DD/YY, h:mm:ss')
                                            : '-'}
                                    </Td>
                                    <Td>
                                        {gasTarget > 0
                                            ? displayComma(gasTarget)
                                            : '-'}
                                    </Td>
                                    <Td>
                                        {+tokensLocked > 0
                                            ? displayComma(
                                                  fromWei(tokensLocked)
                                              )
                                            : '-'}
                                    </Td>
                                    <Td>
                                        {voterReward > 0
                                            ? displayComma(voterReward)
                                            : '-'}
                                    </Td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <LabelCard
                    label={'EGLs Unlocked'}
                    content={
                        Number(tokensUnlocked) > 0
                            ? displayComma(tokensUnlocked)
                            : '-'
                    }
                />
                <div className={'ml-4'}>
                    <SmartButton
                        contract={contract}
                        token={token}
                        walletAddress={walletAddress}
                        noAllowance={noAllowance}
                        hasVoted={hasVoted}
                        canWithdraw={canWithdraw}
                        openVoteModal={() => openVoteModal()}
                        openRevoteModal={() => openRevoteModal()}
                    />
                </div>
            </div>
        </div>
    )
}
