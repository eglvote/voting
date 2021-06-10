import React from 'react'

interface ModalProps {
    style?: object
    className?: string
    children?: JSX.Element | JSX.Element[]
    title: string
}

const Hat = ({ title }) => (
    <div className={'flex justify-center'}>
        <div
            className={
                'flex w-2/3 h-8 -mt-4 bg-white border-gray-400 border-4 text-black justify-center items-center font-bold'
            }
        >
            <p>{title}</p>
        </div>
    </div>
)

export default function HatBox({
    style,
    className,
    children,
    title,
}: ModalProps) {
    return (
        <div
            style={style}
            className={`w-72 h-32 ${
                className ? className : 'bg-black'
            } rounded-xl`}
        >
            <Hat title={title} />
            <div
                className={'flex h-full p-4 -mt-2 justify-center items-center'}
            >
                {children}
            </div>
        </div>
    )
}
