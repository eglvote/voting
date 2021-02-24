import React, { useRef, useEffect } from 'react'
import useOutsideClick from '../hooks/UseOutsideClick'

interface handleOutsideClickParameters {
    (): void
}

interface ModalProps {
    className?: string
    children?: JSX.Element | JSX.Element[]
    style?: any
    handleOutsideClick: handleOutsideClickParameters
}

export default function Modal({
    className,
    children,
    style,
    handleOutsideClick,
}: ModalProps) {
    const ref = useRef()

    useOutsideClick(ref, handleOutsideClick)

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return function cleanup() {
            document.body.style.overflow = 'auto'
        }
    })

    return (
        <div
            className={
                'fixed inset-0 flex items-center justify-center h-screen'
            }
        >
            <div
                ref={ref}
                style={{ animation: `fadeIn .75s` }}
                className={`${className} maxHeight z-50 relative rounded-xl p-2 border shadow bg-white overflow-auto`}
            >
                {children}
            </div>
            <div
                style={{ animation: `fadeIn .75s` }}
                className="fixed inset-0 z-40 blur"
            />
            <div className="opacity-25 fixed inset-0 z-40 bg-black " />
        </div>
    )
}
