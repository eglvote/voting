import React from 'react'

interface handleClickParameters {
    (): void
}

interface ButtonProps {
    style?: object
    className?: string
    children?: JSX.Element | JSX.Element[]
    type?: any
    handleClick?: handleClickParameters
}

export default function Button({
    style,
    className,
    children,
    type,
    handleClick,
}: ButtonProps) {
    return (
        <button
            onClick={handleClick}
            type={type}
            style={{
                boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
                ...style,
            }}
            className={`${className} shadow-xl bg-salmon text-white font-bold text-center rounded-md px-4 py-2 transition duration-500 ease select-none hover:bg-salmon-dark`}
        >
            {children}
        </button>
    )
}
// focus:outline-none focus:shadow-outline
// box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
