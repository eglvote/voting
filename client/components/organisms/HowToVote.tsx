import React from 'react'
import InfoColumn from '../molecules/InfoColumn'

interface HowToVoteProps {
    style?: object
    className?: string
    children?: JSX.Element | JSX.Element[]
    title?: string
}

export default function HowToVote({
    style,
    className,
    children,
    title,
}: HowToVoteProps) {
    return (
        <div className={'flex w-full justify-between p-16 bg-hailStorm'}>
            <InfoColumn svgPath={'static/15.svg'} title={'1. Lock Egls'}>
                <p>
                    {
                        'EGL holders lock EGLs to vote cast their vote.  Voters can choose their desired gas limit +/- 4,000,000 of the current gas limit.  For example, if the current limit is 7M, voters can choose any number between 3M and 11M.'
                    }
                </p>
                <p className={'mt-4 italic'}>
                    {
                        'Tip: The longer you lock up your EGLs, the more weight they have in the vote and in your share of EGL rewards. EGLs can be locked for 1-8 weeks.'
                    }
                </p>
            </InfoColumn>
            <InfoColumn svgPath={'static/16.svg'} title={'2. New Limit Set'}>
                <p>
                    {
                        'Every Friday at 2pm UTC the vote closes and 6 hours later the new desired gas limit is set.'
                    }
                </p>
                <p className={'mt-4 italic'}>
                    {
                        'Tip: Voters can change their vote up until the vote closes by using the “revote” function.'
                    }
                </p>
            </InfoColumn>
            <InfoColumn svgPath={'static/17.svg'} title={'1. Lock Egls'}>
                <p>
                    {
                        'Following the vote, available EGLs are awarded, and eligible EGLs begin to unlock.  EGLs unlocked based on when they were locked.  For example, if you lock your vote on Monday for 1 week, it will be released the following Monday.'
                    }
                </p>
                <p className={'mt-4 italic'}>
                    {
                        'Tip: EGLs that are awarded but not yet unlocked can be added to one’s vote by using the “revote” function.  To keep the same lockup multiplier, extend the lockup time.'
                    }
                </p>
            </InfoColumn>
            <InfoColumn svgPath={'static/18.svg'} title={'1. Lock Egls'}>
                <p>
                    {
                        'All unlocked EGLs may be withdrawn.  You must withdraw all the EGLs before you can vote again.'
                    }
                </p>
                <p className={'mt-4 italic'}>
                    {
                        'Tip: You can use the “withdraw + revote” button to withdraw and revote within the same transaction, saving you on fees.'
                    }
                </p>
            </InfoColumn>
        </div>
    )
}
