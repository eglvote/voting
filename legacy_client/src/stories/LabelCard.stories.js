import React from 'react'
import LabelCard from '../../components/molecules/LabelCard.tsx'

export default {
    title: 'Example/LabelCard',
    component: LabelCard,
}

const Default = () => <LabelCard title={'EGLs Unlocked'} content={'500,000'} />

export const LabelCardExample = Default.bind({})
