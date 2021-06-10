import React from 'react'
import NavBar from '../../components/organisms/NavBar/NavBar.tsx'
import NavBarLink from '../../components/organisms/NavBar/NavBarLink'

export default {
    title: 'Example/NavBar',
    component: NavBar,
}

const Default = () => (
    <NavBar>
        <NavBarLink href={'/dapp'} name={'Dapp'} />
        <NavBarLink href={'/status'} name={'Status'} />
        <NavBarLink href={'/accounts'} name={'Accounts'} />
    </NavBar>
)

export const NavBarExample = Default.bind({})
