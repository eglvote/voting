import React from 'react'
import clsx from 'clsx'

interface ButtonProps {
    style?: object
    className?: string
    children?: JSX.Element[] | JSX.Element
    disabled?: boolean
    handleClick: Function
}

export default function Button({
    style,
    className,
    children,
    disabled,
    handleClick,
}: ButtonProps) {
    return (
        <button
            onClick={() => handleClick()}
            style={style}
            disabled={disabled}
            className={clsx(
                className,
                disabled ? 'opacity-50 cursor-default' : 'cursor-pointer'
            )}
        >
            {children}
        </button>
    )
}
