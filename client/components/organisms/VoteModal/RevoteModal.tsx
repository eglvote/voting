import React from 'react'
import Modal from '../../atoms/Modal'
import Card from '../../atoms/Card'
import RevoteForm from './RevoteModalForm'
import { MAXIMUM_LOCKUP_PERIODS } from '../../../lib/constants'
import m from 'moment'

interface RevoteModalProps {
    style?: object
    className?: string
    contract: any
    token: any
    walletAddress: any
    handleOutsideClick: any
    releaseDate: any
    epochLength: string
    tokensLocked: string
    voterReward: string
    baselineEgl: string
}

// const RP = ({ children }) => <p className={'text-right'}>{children}</p>
export default function RevoteModal({
    style,
    className,
    contract,
    token,
    walletAddress,
    handleOutsideClick,
    releaseDate,
    epochLength,
    tokensLocked,
    voterReward,
    baselineEgl,
}: RevoteModalProps) {
    let lockupOptions = [...Array(MAXIMUM_LOCKUP_PERIODS).keys()]
        .map((x) => x + 1)
        .filter((x) => releaseDate < m().unix() + Number(epochLength) * x)

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
                    <Card className={'mt-6 px-6 bg-gray-100'}>
                        <p>
                            {`Re-voting will apply rewarded EGLs to your current vote of EGLs. You must lock your re-vote for at least ${
                                lockupOptions[0]
                            } ${
                                lockupOptions[0] === 1 ? 'week' : 'week(s)'
                            } - the remaining locked time of your vote.`}
                        </p>
                    </Card>
                    <RevoteForm
                        contract={contract}
                        token={token}
                        walletAddress={walletAddress}
                        releaseDate={releaseDate}
                        epochLength={epochLength}
                        tokensLocked={tokensLocked}
                        voterReward={voterReward}
                        baselineEgl={baselineEgl}
                        callback={() => handleOutsideClick()}
                    />
                </div>
            </div>
        </Modal>
    )
}
