import React from 'react'
import clsx from 'clsx'

interface LineProps {
    className?: string
    style?: object
}

const Line = ({ className, style }: LineProps) => {
    return (
        // <hr class="border-0 bg-gray-500 text-gray-500 h-px">

        <hr
            className={clsx(
                className,
                'border-0 bg-gray-500 text-gray-500 h-px w-400 max-w-full'
            )}
            style={{ ...style, border: '1px solid red' }}
        />
    )
}

export default Line
