import React from 'react'

interface ColumnGroupProps {
    style?: object
    className?: string
    children?: JSX.Element | JSX.Element[]
}

export default function ColumnGroup({
    style,
    className,
    children,
}: ColumnGroupProps) {
    return (
        <div style={style} className={`${className}`}>
            {children}
        </div>
    )
}
