import React from 'react'
import Button from '../atoms/Button'
import { withdraw } from '../../lib/contractMethods'

interface openVoteModal {
    (): void
}

interface openRevoteModal {
    (): void
}

interface SmartButtonProps {
    style?: object
    className?: string
    contract: any
    walletAddress: string
    hasVoted: boolean
    canWithdraw: boolean
    openVoteModal: openVoteModal
    openRevoteModal: openRevoteModal
}

export default function SmartButton({
    style,
    className,
    contract,
    walletAddress,
    hasVoted,
    canWithdraw,
    openVoteModal,
    openRevoteModal,
}: SmartButtonProps) {
    return (
        <>
            {canWithdraw ? (
                <Button
                    style={style}
                    className={`${className} w-40`}
                    handleClick={() => withdraw(contract, walletAddress)}
                >
                    <p>WITHDRAW</p>
                </Button>
            ) : hasVoted ? (
                <Button
                    className={'w-40'}
                    handleClick={() => openRevoteModal()}
                >
                    <p>RE-VOTE</p>
                </Button>
            ) : (
                <Button className={'w-40'} handleClick={() => openVoteModal()}>
                    <p>VOTE</p>
                </Button>
            )}
        </>
    )
}
