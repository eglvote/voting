import React from 'react'
import { fromWei, displayComma } from '../../lib/helpers'
import m from 'moment'
import LabelCard from '../molecules/LabelCard'

interface StatusWidgetProps {
    style?: object
    className?: string
    children?: JSX.Element | JSX.Element[]
    tokensLocked: string
    releaseDate: any
    gasTarget: any
    lockupDuration: any
    voterReward: any
    lockupDate: any
    tokensUnlocked: string
}

const Th = ({ children }) => <th className={'w-32'}>{children}</th>
const Td = ({ children }) => <td className={'w-32 text-center'}>{children}</td>

export default function StatusWidget({
    style,
    className,
    children,
    tokensLocked,
    releaseDate,
    gasTarget,
    lockupDuration,
    voterReward,
    lockupDate,
    tokensUnlocked,
}: StatusWidgetProps) {
    return (
        <div className={`${className}`}>
            <h1 className={'m-8 text-xl font-extrabold text-center'}>
                Your Current EGL Vote
            </h1>
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
                                            : 'N/A'}
                                    </Td>
                                    <Td>
                                        {lockupDuration > 0
                                            ? lockupDuration
                                            : 'N/A'}
                                    </Td>
                                    <Td>
                                        {releaseDate > 0
                                            ? m
                                                  .unix(releaseDate)
                                                  .format('MM/DD/YY, h:mm:ss')
                                            : 'N/A'}
                                    </Td>
                                    <Td>
                                        {gasTarget > 0
                                            ? displayComma(gasTarget)
                                            : 'N/A'}
                                    </Td>
                                    <Td>
                                        {+tokensLocked > 0
                                            ? displayComma(
                                                  fromWei(tokensLocked)
                                              )
                                            : 'N/A'}
                                    </Td>
                                    <Td>
                                        {voterReward > 0
                                            ? displayComma(voterReward)
                                            : 'N/A'}
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
            </div>
        </div>
    )
}
