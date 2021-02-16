import React from 'react'
import Modal from '../../atoms/Modal'
import VoteModalForm from './VoteModalForm'
import Card from '../../atoms/Card'
import { displayComma, fromWei } from '../../../lib/helpers'

interface VoteModalProps {
    style?: object
    className?: string
    contract: any
    token: any
    walletAddress: any
    baselineEgl: any
    eglBalance: any
    handleOutsideClick: any
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
            className={`${className} w-96 p-6 z-10`}
        >
            <div>
                <h1
                    className={
                        'text-xl text-salmon font-bold border-b-2 border-salmon'
                    }
                >
                    VOTE
                </h1>
                <Card className={'mt-6 px-4 bg-gray-100'}>
                    <p>
                        {`The current gas limit is ${displayComma(
                            baselineEgl
                        )} gas and you have ${displayComma(
                            fromWei(eglBalance)
                        )} EGLs to vote with`}
                    </p>
                </Card>
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
