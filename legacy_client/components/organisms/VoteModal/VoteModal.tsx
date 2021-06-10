import React from 'react'
import Modal from '../../atoms/Modal'
import VoteModalForm from './VoteModalForm'
import Card from '../../atoms/Card'
import { displayComma, fromWei } from '../../../lib/helpers'

interface handleOutsideClickParameters {
    (): void
}

interface VoteModalProps {
    style?: object
    className?: string
    contract: any
    token: any
    walletAddress: string
    baselineEgl: number
    eglBalance: string
    handleOutsideClick: handleOutsideClickParameters
}

export default function VoteModal({
    style,
    className,
    contract,
    token,
    walletAddress,
    baselineEgl,
    eglBalance,
    handleOutsideClick,
}: VoteModalProps) {
    return (
        <Modal
            handleOutsideClick={handleOutsideClick}
            className={`${className} p-6 z-10 fixed w-126`}
            style={style}
        >
            <div className={'h-full'}>
                <h1
                    className={
                        'text-xl text-salmon font-boPld border-b-2 border-salmon'
                    }
                >
                    VOTE
                </h1>
                <div className={'w-full flex justify-center'}>
                    <Card className={'mt-6 px-4 bg-gray-100 w-3/4'}>
                        <p>
                            {`The current gas limit is `}
                            {
                                <span className={'font-bold'}>
                                    {displayComma(baselineEgl)}
                                </span>
                            }
                            {` gas and you have `}
                            {
                                <span className={'font-bold'}>
                                    {displayComma(fromWei(eglBalance))}
                                </span>
                            }
                            {' EGLs to vote with'}
                        </p>
                    </Card>
                </div>
                <VoteModalForm
                    contract={contract}
                    token={token}
                    walletAddress={walletAddress}
                    baselineEgl={baselineEgl}
                    handleOutsideClick={() => handleOutsideClick()}
                />
            </div>
        </Modal>
    )
}
