import React from 'react'

interface LabelCardProps {
    style?: object
    className?: string
    label: string
    content: string
}

export default function LabelCard({
    style,
    className,
    label,
    content,
}: LabelCardProps) {
    return (
        <div style={style} className={`${className} w-40 ml-4`}>
            <div>
                <h3 className={'text-center font-bold text-babyBlue'}>
                    {label}
                </h3>
            </div>
            <div
                className={`flex justify-center items-center h-20 rounded-xl bg-hailStorm mt-4`}
            >
                <h3 className={'text-center text-babyBlue'}>{content}</h3>
            </div>
        </div>
    )
}
