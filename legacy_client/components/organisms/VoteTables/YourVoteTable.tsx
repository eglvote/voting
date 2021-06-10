import React from 'react'
import { formatFromWei, displayComma } from '../../../lib/helpers'
import m from 'moment'
import { truncateEthAddress } from '../../../lib/helpers'
import { ZeroAddress } from '../../../lib/constants'
import useMediaQuery from '../../hooks/UseMediaQuery'

interface YourVoteTableProps {
    style?: object
    className?: string
    tokensLocked: string
    releaseDate: string
    gasTarget: string
    lockupDuration: string
    voterReward: string
    lockupDate: string
    // daoAmount: string
    // daoRecipient: string
    // upgradeAddress: string
}
const Td = ({ children }) => (
    <td className={'text-left h-10 p-2 px-4'}>{children}</td>
)
const Th = ({ children }) => (
    <th
        className={
            'text-left text-white bg-babyBlue p-2 px-4 w-40 font-normal text-sm'
        }
    >
        {children}
    </th>
)

export default function YourVoteTable({
    style,
    className,
    tokensLocked,
    releaseDate,
    gasTarget,
    lockupDuration,
    voterReward,
    lockupDate,
}: // daoAmount,
// daoRecipient,
// upgradeAddress,
YourVoteTableProps) {
    let isPageWide = useMediaQuery('(min-width: 1100px)')

    return (
        <>
            {isPageWide ? (
                <div
                    style={style}
                    className={`${className} w-6/7 border rounded`}
                >
                    <table className={'w-full rounded overflow-hidden p-4'}>
                        <tr className={'w-full bg-babyBlue px-2'}>
                            <Th>Vote</Th>
                            <Th>EGL Locked</Th>
                            <Th>Lockup</Th>
                            <Th>Lock Date</Th>
                            <Th>Unlock Date</Th>
                            <Th>EGLs Awarded</Th>
                            {/* <Th>Dao Vote</Th>
                            <Th>Dao Amount</Th> */}
                            {/* <Th>Contract Upgrade</Th> */}
                        </tr>
                        <tr className={'w-full bg-white'}>
                            <Td>
                                {gasTarget != '0'
                                    ? displayComma(gasTarget)
                                    : '-'}
                            </Td>
                            <Td>
                                {tokensLocked != '0'
                                    ? formatFromWei(tokensLocked)
                                    : '-'}
                            </Td>
                            <Td>
                                {lockupDuration != '0' ? lockupDuration : '-'}
                            </Td>
                            <Td>
                                {String(releaseDate) != '0'
                                    ? m
                                          .unix(Number(releaseDate))
                                          .format('MM.DD.YY')
                                    : '-'}
                            </Td>
                            <Td>
                                {String(lockupDate) != '0'
                                    ? m
                                          .unix(Number(lockupDate))
                                          .format('MM.DD.YY')
                                    : '-'}
                            </Td>
                            <Td>
                                {voterReward != '0'
                                    ? displayComma(
                                          parseInt(voterReward).toFixed(3)
                                      )
                                    : '-'}
                            </Td>
                            {/* <Td>
                                {daoRecipient != ZeroAddress
                                    ? truncateEthAddress(daoRecipient)
                                    : '-'}
                            </Td>
                            <Td>
                                {daoAmount != '0'
                                    ? formatFromWei(daoAmount)
                                    : '-'}
                            </Td> */}
                            {/* <Td>
                                {daoRecipient != ZeroAddress
                                    ? truncateEthAddress(upgradeAddress)
                                    : '-'}
                            </Td> */}
                        </tr>
                    </table>
                </div>
            ) : (
                <div style={style} className={`${className} w-6/7 rounded`}>
                    <table className={'w-full rounded overflow-hidden p-4'}>
                        <tr className={'w-full bg-babyBlue px-2'}>
                            <Th>Vote</Th>
                            <Th>EGL Locked</Th>
                            <Th>Lockup</Th>
                            <Th>Lock Date</Th>
                            <Th>Unlock Date</Th>
                        </tr>
                        <tr className={'w-full bg-white'}>
                            <Td>
                                {gasTarget != '0'
                                    ? displayComma(gasTarget)
                                    : '-'}
                            </Td>
                            <Td>
                                {tokensLocked != '0'
                                    ? formatFromWei(tokensLocked)
                                    : '-'}
                            </Td>
                            <Td>
                                {lockupDuration != '0' ? lockupDuration : '-'}
                            </Td>
                            <Td>
                                {String(releaseDate) != '0'
                                    ? m
                                          .unix(Number(releaseDate))
                                          .format('MM.DD.YY')
                                    : '-'}
                            </Td>
                            <Td>
                                {String(lockupDate) != '0'
                                    ? m
                                          .unix(Number(lockupDate))
                                          .format('MM.DD.YY')
                                    : '-'}
                            </Td>
                        </tr>
                    </table>
                    <table
                        className={'w-full rounded overflow-hidden p-4 mt-4'}
                    >
                        <tr className={'w-full bg-babyBlue px-2'}>
                            <Th>EGLs Awarded</Th>
                            {/* <Th>Dao Vote</Th>
                            <Th>Dao Amount</Th> */}
                            {/* <Th>Contract Upgrade</Th> */}
                        </tr>
                        <tr className={'w-full bg-white'}>
                            <Td>
                                {voterReward != '0'
                                    ? displayComma(
                                          parseInt(voterReward).toFixed(3)
                                      )
                                    : '-'}
                            </Td>
                            {/* <Td>
                                {daoRecipient != ZeroAddress
                                    ? truncateEthAddress(daoRecipient)
                                    : '-'}
                            </Td>
                            <Td>
                                {daoAmount != '0'
                                    ? formatFromWei(daoAmount)
                                    : '-'}
                            </Td> */}
                            {/* <Td>
                                {daoRecipient != ZeroAddress
                                    ? truncateEthAddress(upgradeAddress)
                                    : '-'}
                            </Td> */}
                        </tr>
                    </table>
                </div>
            )}
        </>
    )
}
