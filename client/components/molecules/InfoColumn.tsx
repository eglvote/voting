import React from 'react'

interface InfoColumnProps {
    style?: object
    className?: string
    title: string
    svgPath: string
    children: JSX.Element | JSX.Element[]
    index?: string
}

export default function InfoColumn({
    style,
    className,
    title,
    svgPath,
    children,
    index,
}: InfoColumnProps) {
    return (
        <div
            style={style}
            className={`${className} border p-6 pt-8 bg-white rounded-xl shadow-xl w-72`}
        >
            {index && <h1 className={'text-gray-500'}>{index}</h1>}
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
            <div>{children}</div>
        </div>
    )
}
