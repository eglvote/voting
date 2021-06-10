import React from 'react'

interface CardProps {
    style?: object
    className?: string
    children?: JSX.Element | JSX.Element[]
}

export default function Card({ style, className, children }: CardProps) {
    return (
        <div style={style} className={`${className} rounded-md p-3`}>
            {children}
        </div>
    )
}
