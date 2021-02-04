import React from 'react'
import Modal from '../../atoms/Modal'
import Card from '../../atoms/Card'
import RevoteForm from './RevoteModalForm'

interface RevoteModalProps {
    style?: object
    className?: string
    contract: any
    token: any
    walletAddress: any
    handleOutsideClick: any
    releaseDate: any
    epochLength: string
}

export default function RevoteModal({
    style,
    className,
    contract,
    token,
    walletAddress,
    handleOutsideClick,
    releaseDate,
    epochLength,
}: RevoteModalProps) {
    return (
        <Modal
            handleOutsideClick={handleOutsideClick}
            className={`${className} py-8 px-12`}
        >
            <div style={{ width: '28em' }}>
                <h1
                    className={
                        'text-xl text-salmon font-bold border-b-2 border-salmon'
                    }
                >
                    RE-VOTE
                </h1>
                <div>
                    <Card className={'mt-6 px-8 bg-gray-100'}>
                        <p>Re-voting will apply rewarded EGLs</p>
                        <p>to your current vote of EGLs. You must</p>
                        <p>lock your re-vote for at least # weeks - the</p>
                        <p>remaining locked time of your current vote.</p>
                    </Card>
                    <RevoteForm
                        contract={contract}
                        token={token}
                        walletAddress={walletAddress}
                        releaseDate={releaseDate}
                        epochLength={epochLength}
                    />
                </div>
            </div>
        </Modal>
    )
}
