import React from 'react'
import Modal from '../../atoms/Modal'
import VoteModalForm from './VoteModalForm'

interface VoteModalProps {
    style?: object
    className?: string
    contract: any
    token: any
    walletAddress: any
    handleOutsideClick: any
}

export default function VoteModal({
    style,
    className,
    contract,
    token,
    walletAddress,
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
                <VoteModalForm
                    contract={contract}
                    token={token}
                    walletAddress={walletAddress}
                    handleOutsideClick={() => handleOutsideClick()}
                />
            </div>
        </Modal>
    )
}
