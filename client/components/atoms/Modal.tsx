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
                'fixed inset-0 flex flex-col items-center justify-center h-screen'
            }
        >
            <div className={'w-full z-50'}></div>
            <img
                width={'25'}
                src="/static/x.svg"
                className={
                    'z-50 -mr-96 -mt-20 m-6 hover:opacity-50 cursor-pointer'
                }
            />
            <div
                ref={ref}
                style={{ animation: `fadeIn .75s` }}
                className={`${className} maxHeight z-50 relative rounded-xl p-2 border shadow-2xl bg-white overflow-auto`}
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
