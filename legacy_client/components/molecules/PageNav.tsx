import React from 'react'

interface handleClickParameters {
    (): void
}
interface PageNavProps {
    style?: object
    className?: string
    pageNumber?: number
    numberOfEvents: number
    onClickLeft?: handleClickParameters
    onClickRight?: handleClickParameters
}

export default function PageNav({
    style,
    className,
    pageNumber,
    numberOfEvents,
    onClickLeft,
    onClickRight,
}: PageNavProps) {
    const onFirstPage = pageNumber === 0
    const onLastPage = numberOfEvents < 10

    return (
        <div
            style={style}
            className={`${className} flex justify-center items-center`}
        >
            <div
                onClick={() => (!onFirstPage ? onClickLeft() : null)}
                className={`px-4 hover:opacity-50 ${
                    !onFirstPage ? 'cursor-pointer' : 'opacity-50'
                }`}
            >
                <img width={'15px'} src={'/static/TriangleArrow-Left.svg'} />
            </div>
            <span className={'m-4'}>{pageNumber + 1}</span>
            <div
                onClick={() => (!onLastPage ? onClickRight() : null)}
                className={`px-4 hover:opacity-50 ${
                    onLastPage ? 'opacity-50' : 'cursor-pointer'
                }`}
            >
                <img width={'15px'} src={'/static/TriangleArrow-Right.svg'} />
            </div>
        </div>
    )
}
