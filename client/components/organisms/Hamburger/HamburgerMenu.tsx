import React, { useState } from 'react'
import HamburgerIcon from './HamburgerIcon'
import HamburgerDropdown from './HamburgerDropdown'

interface HamburgerMenuProps {
    style?: object
    className?: string
    links: string[]
}

export default function HamburgerMenu({
    style,
    className,
    links,
}: HamburgerMenuProps) {
    const [clicked, setClicked] = useState(false)

    return (
        <>
            <div
                onClick={() => setClicked(true)}
                style={style}
                className={`${className} hover:opacity-50 cursor-pointer flex content-center justify-center`}
            >
                <HamburgerIcon className={'mx-5'} />
            </div>
            {clicked && (
                <HamburgerDropdown
                    links={links}
                    handleClick={() => setClicked(false)}
                />
            )}
        </>
    )
}
