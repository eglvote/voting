import React from 'react'

import HatBox from '../../components/molecules/HatBox.tsx'

export default {
    title: 'Example/HatBox',
    component: HatBox,
}

const GasLimitTemplate = () => (
    <HatBox title={'CURRENT GAS LIMIT'} className={'bg-babyBlue'}>
        <p className={'font-extrabold text-4xl text-white'}>12,500,000</p>
    </HatBox>
)

const NextVoteTemplate = () => (
    <HatBox title={'NEXT VOTE CLOSING'} className={'bg-black'}>
        <p className={'font-extrabold text-2xl text-white text-center'}>
            1 DAY 3 HOURS 11 MINUTES
        </p>
    </HatBox>
)

const AwardedTemplate = () => (
    <HatBox title={'EGLs TO BE REWARDED'} className={'bg-black'}>
        <p className={'font-extrabold text-4xl text-white'}>500,000</p>
    </HatBox>
)

export const GasLimit = GasLimitTemplate.bind({})
export const NextVote = NextVoteTemplate.bind({})
export const Awarded = AwardedTemplate.bind({})
