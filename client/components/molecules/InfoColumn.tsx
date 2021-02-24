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
            <div className={'w-full flex justify-center'}>
                <img className={'w-1/2'} src={svgPath} />
            </div>
            <h1
                className={
                    'text-2xl text-center text-babyBlue font-bold mt-4 mb-4'
                }
            >
                {title}
            </h1>
            {/* <Line className={'text-babyBlue bg-black h-1 my-2'} /> */}
            <div>{children}</div>
        </div>
    )
}
