import React from 'react'
import InfoColumn from '../molecules/InfoColumn'

interface HowToVoteProps {
    style?: object
    className?: string
    children?: JSX.Element | JSX.Element[]
    title?: string
}

const Content = ({ children, className }: any) => (
    <p className={`${className} text-sm text-justify`}>{children}</p>
)

export default function HowToVote({
    style,
    className,
    children,
    title,
}: HowToVoteProps) {
    return (
        <div className={'flex w-full justify-between p-8'}>
            <InfoColumn svgPath={'static/15.svg'} title={'Lock Egls'}>
                <Content>
                    {
                        'EGL holders lock EGLs to vote cast their vote.  Voters can choose their desired gas limit +/- 4,000,000 of the current gas limit.  For example, if the current limit is 7M, voters can choose any number between 3M and 11M.'
                    }
                </Content>
                <Content className={'mt-4 italic text-sm'}>
                    {
                        'Tip: The longer you lock up your EGLs, the more weight they have in the vote and in your share of EGL rewards. EGLs can be locked for 1-8 weeks.'
                    }
                </Content>
            </InfoColumn>
            <InfoColumn svgPath={'static/16.svg'} title={'New Limit Set'}>
                <Content>
                    {
                        'Every Friday at 2pm UTC the vote closes and 6 hours later the new desired gas limit is set.'
                    }
                </Content>
                <Content className={'mt-4 italic'}>
                    {
                        'Tip: Voters can change their vote up until the vote closes by using the “revote” function.'
                    }
                </Content>
            </InfoColumn>
            <InfoColumn svgPath={'static/17.svg'} title={'Unlock'}>
                <Content>
                    {
                        'Following the vote, available EGLs are awarded, and eligible EGLs begin to unlock.  EGLs unlocked based on when they were locked.  For example, if you lock your vote on Monday for 1 week, it will be released the following Monday.'
                    }
                </Content>
                <Content className={'mt-4 italic'}>
                    {
                        'Tip: EGLs that are awarded but not yet unlocked can be added to one’s vote by using the “revote” function.  To keep the same lockup multiplier, extend the lockup time.'
                    }
                </Content>
            </InfoColumn>
            <InfoColumn svgPath={'static/18.svg'} title={'Withdraw'}>
                <Content>
                    {
                        'All unlocked EGLs may be withdrawn.  You must withdraw all the EGLs before you can vote again.'
                    }
                </Content>
                <Content className={'mt-4 italic'}>
                    {
                        'Tip: You can use the “withdraw + revote” button to withdraw and revote within the same transaction, saving you on fees.'
                    }
                </Content>
            </InfoColumn>
        </div>
    )
}
