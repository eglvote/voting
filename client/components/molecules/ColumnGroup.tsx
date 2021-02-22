import React from 'react'

interface ColumnGroupProps {
    style?: object
    className?: string
    children?: JSX.Element | JSX.Element[]
    title: string
}

export default function ColumnGroup({
    style,
    className,
    children,
    title,
}: ColumnGroupProps) {
    return <div>{children}</div>
}
