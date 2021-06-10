import React from 'react'
import '../../styles/globals.css'

import Button from '../../components/atoms/Button.tsx'

export default {
    title: 'Example/Button',
    component: Button,
}

const Template = () => <Button>Click me!</Button>

export const Primary = Template.bind({})
