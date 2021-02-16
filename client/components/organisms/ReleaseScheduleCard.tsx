import React from 'react'
import m from 'moment'
import { fromWei, displayComma } from '../../lib/helpers'

interface ReleaseScheduleCardProps {
    style?: object
    className?: string
    eventEglsMatched: any
}
const Td = ({ children }) => <td className={'text-left'}>{children}</td>
const Th = ({ children }) => <th className={'text-left'}>{children}</th>

export default function ReleaseScheduleCard({
    style,
    className,
    eventEglsMatched,
}: ReleaseScheduleCardProps) {
    return (
        <div
            style={{ width: '35em', ...style }}
            className={`${className} mt-10 border p-5 rounded-xl bg-white`}
        >
            {eventEglsMatched.length ? (
                <table className={'w-full'}>
                    <thead>
                        <Th>Fund Date</Th>
                        <Th>Release Date</Th>
                        <Th>ETH Sent</Th>
                        <Th>Pool Tokens Received</Th>
                    </thead>
                    {eventEglsMatched &&
                        eventEglsMatched.map((event) => {
                            return (
                                <tr>
                                    <Td>{'-'}</Td>
                                    <Td>
                                        {m
                                            .unix(event.returnValues.date)
                                            .format('M/D/YY')}
                                    </Td>
                                    <Td>
                                        {fromWei(
                                            event.returnValues.ethToBeDeployed
                                        )}
                                    </Td>
                                    <Td>
                                        {fromWei(
                                            event.returnValues.eglsToBeMatched
                                        )}
                                    </Td>
                                </tr>
                            )
                        })}
                </table>
            ) : (
                <p className={'text-xl font-bold text-center'}>
                    * NO EGLS CLAIMED *
                </p>
            )}
        </div>
    )
}
