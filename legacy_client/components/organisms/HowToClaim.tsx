import React from 'react'
import InfoColumn from '../molecules/InfoColumn'
import { JsxElement } from 'typescript'

interface HowToVoteProps {
    style?: object
    className?: string
    title?: string
}

interface ContentProps {
    children: JsxElement | JsxElement[] | string
    className?: string
}

const Content = ({ children, className }: ContentProps) => (
    <p className={`${className} text-sm text-justify`}>{children}</p>
)

export default function HowToVote({ style, className }: HowToVoteProps) {
    return (
        <div
            style={style}
            className={`${className} flex w-full justify-start flex-wrap mt-8`}
        >
            <InfoColumn
                svgPath={'/static/10.svg'}
                title={'Send ETH'}
                index={'01'}
                className={'mb-8 mr-8'}
            >
                <Content>
                    {'Any ETH holder can send ETH to the EGL smart contract'}
                </Content>
            </InfoColumn>
            <InfoColumn
                svgPath={'/static/11.svg'}
                title={'Match'}
                index={'02'}
                className={'mb-8 mr-8'}
            >
                <Content>
                    {
                        'The value of the ETH will be matched by the EGL contract and sent to fund the ETH-EGL Uniswap Pool.'
                    }
                </Content>
            </InfoColumn>
            <InfoColumn
                svgPath={'/static/12.svg'}
                title={'Wait'}
                index={'03'}
                className={'mb-8 mr-8'}
            >
                <Content>
                    {
                        'The ETH holder receives her respective pool tokens to be released after a lockup period ranging between as early as 10 weeks for the first actor to one year for the last actor.'
                    }
                </Content>
            </InfoColumn>
            <InfoColumn
                svgPath={'/static/13.svg'}
                title={'Withdraw'}
                index={'04'}
                className={'mb-8'}
            >
                <Content>
                    {
                        'Unlocked pool tokens can be withdrawn.  Like all Uniswap pool tokens, they can be used to claim your share of the underlying pool.'
                    }
                </Content>
            </InfoColumn>
        </div>
    )
}
