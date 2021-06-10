import React from 'react'

interface LineProps {
    style?: object
    className?: string
    children?: JSX.Element | JSX.Element[]
}

export default function Line({ style, className, children }: LineProps) {
    return <hr className={className} style={style} />
}
