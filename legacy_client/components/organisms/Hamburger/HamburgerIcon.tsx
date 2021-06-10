import React from 'react'

interface HamburgerIconProps {
    style?: object
    className?: string
}

export default function HamburgerIcon({
    style,
    className,
}: HamburgerIconProps) {
    return (
        <div style={style} className={`${className} flex content-center`}>
            <img style={{ minWidth: '30px' }} src={'/static/bars-solid.svg'} />
        </div>
    )
}
