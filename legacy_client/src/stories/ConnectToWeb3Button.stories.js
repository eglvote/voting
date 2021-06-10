import React from 'react'

import ConnectToWeb3Button from '../../components/molecules/ConnectToWeb3Button.tsx'

export default {
    title: 'Example/ConnectToWeb3Button',
    component: ConnectToWeb3Button,
}

const Disconnected = () => (
    <ConnectToWeb3Button
        callback={() => alert('Connected!')}
        walletAddress={null}
    >
        Connect To Metamask
    </ConnectToWeb3Button>
)

const Connected = () => (
    <ConnectToWeb3Button
        callback={() => alert('Connected!')}
        walletAddress={'0x46c3f92bfd034e8ad67f0735030fe59d9f61c7b1'}
    >
        Connect To Metamask
    </ConnectToWeb3Button>
)

export const Before = Disconnected.bind({})

export const After = Connected.bind({})
