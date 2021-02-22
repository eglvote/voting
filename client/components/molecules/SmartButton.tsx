import React from 'react'
import Button from '../atoms/Button'
import { withdraw } from '../../lib/contractMethods'

interface SmartButtonProps {
    style?: object
    className?: string
    contract: any
    token: any
    walletAddress: string
    noAllowance: boolean
    hasVoted: boolean
    canWithdraw: boolean
    openVoteModal: any
    openRevoteModal: any
}

export default function SmartButton({
    style,
    className,
    contract,
    token,
    walletAddress,
    noAllowance,
    hasVoted,
    canWithdraw,
    openVoteModal,
    openRevoteModal,
}: SmartButtonProps) {
    return (
        <>
            {canWithdraw ? (
                <Button
                    className={'w-40'}
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
