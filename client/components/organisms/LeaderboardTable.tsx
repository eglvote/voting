import React, { useState } from 'react'
import { formatFromWei, truncateEthAddress } from '../../lib/helpers'
import { JsxElement } from 'typescript'
import PageNav from '../molecules/PageNav'

interface account {
    returnValues: {
        caller: string
        eglAmount: string
        gasTarget: string
        lockupDuration: string
    }
}

interface LeaderboardTableProps {
    style?: object
    className?: string
    eventVote?: account[]
    seedAccounts?: any
}

interface tProp {
    children: JsxElement | JsxElement[] | string
}

const Td = ({ children }: tProp) => (
    <td className={'text-left h-10'}>{children}</td>
)

const Th = ({ children }: tProp) => <th className={'text-left'}>{children}</th>

const dummydata = [
    {
        logIndex: 1,
        transactionIndex: 0,
        transactionHash:
            '0x3b4fdbba5ff1a73681a5fe00a6a28381633616987cc2153c42e7141b00d3814b',
        blockHash:
            '0x009aa90cf2e472b11308058bf85d04cda34b82918a8fff9c3da3e68d11f37a4b',
        blockNumber: 13,
        address: '0x46470F12BD299520cF2d1a74f2C2D31D710B3750',
        type: 'mined',
        removed: false,
        id: 'log_553a453c',
        returnValues: {
            '0': '0x15482a08720eDd36Ae3d3DbF77d311b155622bB3',
            '1': '0',
            '2': '6721975',
            '3': '2500000000000000000000000',
            '4': '8',
            '5': '1616529926',
            '6': '0x0000000000000000000000000000000000000000',
            '7': '0',
            '8': '0x0000000000000000000000000000000000000000',
            '9': '20000000000000000000000000',
            '10': '134439500000000000000000000000000',
            '11': '20000000000000000000000000',
            '12': '2500000000000000000000000',
            '13': '1616514327',
            caller: '0x15482a08720eDd36Ae3d3DbF77d311b155622bB3',
            currentEpoch: '0',
            gasTarget: '6721975',
            eglAmount: '2500000000000000000000000',
            lockupDuration: '8',
            releaseDate: '1616529926',
            daoRecipient: '0x0000000000000000000000000000000000000000',
            daoAmount: '0',
            upgradeAddress: '0x0000000000000000000000000000000000000000',
            epochVoteWeightSum: '20000000000000000000000000',
            epochGasTargetSum: '134439500000000000000000000000000',
            epochVoterRewardSum: '20000000000000000000000000',
            epochTotalVotes: '2500000000000000000000000',
            date: '1616514327',
        },
        event: 'Vote',
        signature:
            '0x3c2547bd2f36e871bafd586b86e9c895f44ab7185759800898cf5f371c9fbc17',
        raw: {
            data:
                '0x00000000000000000000000015482a08720edd36ae3d3dbf77d311b155622bb3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006691b70000000000000000000000000000000000000000000211654585005212800000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000605a4a06000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000108b2a2c2802909400000000000000000000000000000000000000000006a0dd73f6193fa8b12dcc000000000000000000000000000000000000000000000000108b2a2c28029094000000000000000000000000000000000000000000000000021165458500521280000000000000000000000000000000000000000000000000000000000000605a0d17',
            topics: [
                '0x3c2547bd2f36e871bafd586b86e9c895f44ab7185759800898cf5f371c9fbc17',
            ],
        },
    },
    {
        logIndex: 3,
        transactionIndex: 0,
        transactionHash:
            '0x3b4fdbba5ff1a73681a5fe00a6a28381633616987cc2153c42e7141b00d3814b',
        blockHash:
            '0x009aa90cf2e472b11308058bf85d04cda34b82918a8fff9c3da3e68d11f37a4b',
        blockNumber: 13,
        address: '0x46470F12BD299520cF2d1a74f2C2D31D710B3750',
        type: 'mined',
        removed: false,
        id: 'log_0b86cb2c',
        returnValues: {
            '0': '0x5B4bf9D392771C4668C74fF703e8d8DBF30CF6d6',
            '1': '0',
            '2': '6721975',
            '3': '2500000000000000000000000',
            '4': '8',
            '5': '1616529926',
            '6': '0x0000000000000000000000000000000000000000',
            '7': '0',
            '8': '0x0000000000000000000000000000000000000000',
            '9': '40000000000000000000000000',
            '10': '268879000000000000000000000000000',
            '11': '40000000000000000000000000',
            '12': '5000000000000000000000000',
            '13': '1616514327',
            caller: '0x5B4bf9D392771C4668C74fF703e8d8DBF30CF6d6',
            currentEpoch: '0',
            gasTarget: '6721975',
            eglAmount: '2500000000000000000000000',
            lockupDuration: '8',
            releaseDate: '1616529926',
            daoRecipient: '0x0000000000000000000000000000000000000000',
            daoAmount: '0',
            upgradeAddress: '0x0000000000000000000000000000000000000000',
            epochVoteWeightSum: '40000000000000000000000000',
            epochGasTargetSum: '268879000000000000000000000000000',
            epochVoterRewardSum: '40000000000000000000000000',
            epochTotalVotes: '5000000000000000000000000',
            date: '1616514327',
        },
        event: 'Vote',
        signature:
            '0x3c2547bd2f36e871bafd586b86e9c895f44ab7185759800898cf5f371c9fbc17',
        raw: {
            data:
                '0x0000000000000000000000005b4bf9d392771c4668c74ff703e8d8dbf30cf6d6000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006691b70000000000000000000000000000000000000000000211654585005212800000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000605a4a0600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000021165458500521280000000000000000000000000000000000000000000d41bae7ec327f51625b9800000000000000000000000000000000000000000000000021165458500521280000000000000000000000000000000000000000000000000422ca8b0a00a42500000000000000000000000000000000000000000000000000000000000000605a0d17',
            topics: [
                '0x3c2547bd2f36e871bafd586b86e9c895f44ab7185759800898cf5f371c9fbc17',
            ],
        },
    },
    {
        logIndex: 2,
        transactionIndex: 0,
        transactionHash:
            '0xd108550c56f8ad9d024c8752767888f58425cc02d5cb50df5549d7afb0af4211',
        blockHash:
            '0xcb1c75be8756a04ffea70dd5be05dda39c743511d0ccfd48e1c206d26840d7f7',
        blockNumber: 21,
        address: '0x46470F12BD299520cF2d1a74f2C2D31D710B3750',
        type: 'mined',
        removed: false,
        id: 'log_bfe38d8c',
        returnValues: {
            '0': '0x29Ed2201a07431188d3E2F20558cB8d577e238e0',
            '1': '0',
            '2': '5000000',
            '3': '4000000000000000000000000',
            '4': '4',
            '5': '1616515739',
            '6': '0x0000000000000000000000000000000000000000',
            '7': '0',
            '8': '0x0000000000000000000000000000000000000000',
            '9': '56000000000000000000000000',
            '10': '348879000000000000000000000000000',
            '11': '56000000000000000000000000',
            '12': '9000000000000000000000000',
            '13': '1616514539',
            caller: '0x29Ed2201a07431188d3E2F20558cB8d577e238e0',
            currentEpoch: '0',
            gasTarget: '5000000',
            eglAmount: '4000000000000000000000000',
            lockupDuration: '4',
            releaseDate: '1616515739',
            daoRecipient: '0x0000000000000000000000000000000000000000',
            daoAmount: '0',
            upgradeAddress: '0x0000000000000000000000000000000000000000',
            epochVoteWeightSum: '56000000000000000000000000',
            epochGasTargetSum: '348879000000000000000000000000000',
            epochVoterRewardSum: '56000000000000000000000000',
            epochTotalVotes: '9000000000000000000000000',
            date: '1616514539',
        },
        event: 'Vote',
        signature:
            '0x3c2547bd2f36e871bafd586b86e9c895f44ab7185759800898cf5f371c9fbc17',
        raw: {
            data:
                '0x00000000000000000000000029ed2201a07431188d3e2f20558cb8d577e238e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004c4b40000000000000000000000000000000000000000000034f086f3b33b684000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000605a129b0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002e5276153cd3fb38000000000000000000000000000000000000000000113378d8ed4883dbbb8f980000000000000000000000000000000000000000000000002e5276153cd3fb380000000000000000000000000000000000000000000000000771d2fa45345aa900000000000000000000000000000000000000000000000000000000000000605a0deb',
            topics: [
                '0x3c2547bd2f36e871bafd586b86e9c895f44ab7185759800898cf5f371c9fbc17',
            ],
        },
    },
]

export default function LeaderboardTable({
    style,
    className,
    eventVote,
    seedAccounts,
}: LeaderboardTableProps) {
    let [pageNumber, setPageNumber] = useState(0)

    eventVote = [
        ...eventVote,
        ...dummydata,
        ...dummydata,
        ...dummydata,
        ...dummydata,
        ...dummydata,
        ...dummydata,
        ...dummydata,
        ...dummydata,
    ]
    let eventsToDisplay =
        eventVote.length > 10
            ? eventVote.slice(pageNumber * 10, pageNumber * 10 + 10)
            : eventVote
    return (
        <div
            style={style}
            className={`${className} h-144 w-full px-8 pt-8 rounded-xl bg-white border`}
        >
            <div style={{ height: '90%' }}>
                <h1 className={'text-salmon text-2xl font-bold mb-4'}>
                    Leaderboard - Current Votes
                </h1>
                <table className={'w-full'}>
                    <tr className={'w-full'}>
                        <Th>Address</Th>
                        <Th>EGLs Voting</Th>
                        <Th>Vote</Th>
                        <Th>Weeks Locked</Th>
                        <Th>EGL Seed*</Th>
                    </tr>
                    {eventsToDisplay.map((account) => {
                        return (
                            <tr className={'w-full'}>
                                <Td>
                                    {truncateEthAddress(
                                        account.returnValues.caller
                                    )}
                                </Td>
                                <Td>
                                    {formatFromWei(
                                        account.returnValues.eglAmount
                                    )}
                                </Td>
                                <Td>{account.returnValues.gasTarget}</Td>
                                <Td>{account.returnValues.lockupDuration}</Td>
                                <Td>
                                    {seedAccounts.includes(
                                        account.returnValues.caller
                                    )
                                        ? 'Yes'
                                        : 'No'}
                                </Td>
                            </tr>
                        )
                    })}
                </table>
            </div>
            <div
                style={{
                    height: '10%',
                }}
                className={'w-full'}
            >
                <PageNav
                    pageNumber={pageNumber}
                    numberOfEvents={eventsToDisplay.length}
                    onClickLeft={() => {
                        setPageNumber(pageNumber - 1)
                    }}
                    onClickRight={() => {
                        setPageNumber(pageNumber + 1)
                    }}
                />
            </div>
        </div>
    )
}
