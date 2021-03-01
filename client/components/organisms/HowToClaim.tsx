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
}: HowToVoteProps) {
    return (
        <div className={'flex w-full justify-between p-8'}>
            <InfoColumn svgPath={'static/10.svg'} title={'Send ETH'}>
                <Content>
                    {'Any ETH holder can send ETH to the EGL smart contract'}
                </Content>
            </InfoColumn>
            <InfoColumn svgPath={'static/11.svg'} title={'Match'}>
                <Content>
                    {
                        'The value of the ETH will be matched by the EGL contract and sent to fund the ETH-EGL Uniswap Pool.'
                    }
                </Content>
            </InfoColumn>
            <InfoColumn svgPath={'static/12.svg'} title={'Wait'}>
                <Content>
                    {
                        'The ETH holder receives her respective pool tokens to be released after a lockup period ranging between as early as 10 weeks for the first actor to one year for the last actor.'
                    }
                </Content>
            </InfoColumn>
            <InfoColumn svgPath={'static/13.svg'} title={'Withdraw'}>
                <Content>
                    {
                        'Unlocked pool tokens can be withdrawn.  Like all Uniswap pool tokens, they can be used to claim your share of the underlying pool.'
                    }
                </Content>
            </InfoColumn>
        </div>
    )
}
