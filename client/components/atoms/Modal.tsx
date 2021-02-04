import React, { useRef } from 'react'
import useOutsideClick from '../hooks/UseOutsideClick'

interface handleOutsideClickParameters {
    (): void
}

interface ModalProps {
    className?: string
    children?: JSX.Element | JSX.Element[]
    handleOutsideClick: handleOutsideClickParameters
}

export default function ({
    className,
    children,
    handleOutsideClick,
}: ModalProps) {
    const ref = useRef()

    useOutsideClick(ref, handleOutsideClick)

    return (
        <div
            className={
                'fixed inset-0 flex items-center justify-center h-screen overflow-auto'
            }
        >
            <div
                ref={ref}
                style={{ animation: `fadeIn 1s` }}
                className={`${className} z-40 relative rounded-xl p-2 border shadow bg-white`}
            >
                {children}
            </div>

            <div className="opacity-25 fixed inset-0 z-30 bg-black" />
        </div>
    )
}
