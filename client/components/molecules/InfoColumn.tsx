import React from 'react'
import Line from '../atoms/Line'

interface InfoColumnProps {
    style?: object
    className?: string
    title: string
    svgPath: string
    children: any
}

export default function InfoColumn({
    style,
    className,
    title,
    svgPath,
    children,
}: InfoColumnProps) {
    return (
        <div className={'w-1/5 ml-4'}>
            <img src={svgPath} />
            <h1 className={'text-2xl font-bold mt-4'}>{title}</h1>
            <Line className={'text-babyBlue bg-babyBlue h-1 my-2'} />
            <div>{children}</div>
        </div>
    )
}
