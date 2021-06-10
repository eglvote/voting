import React from 'react'

interface KeyValTableProps {
    style?: object
    className?: string
    title: string
    val: string
}

const Td = ({ children }) => (
    <td className={'text-left h-10 p-2 px-4 text-sm'}>{children}</td>
)

const Th = ({ children }) => (
    <th
        className={
            'text-left text-white bg-babyBlue p-2 px-4 text-sm font-normal'
        }
    >
        {children}
    </th>
)

export default function KeyValTable({
    style,
    className,
    title,
    val,
}: KeyValTableProps) {
    return (
        <div style={style} className={`${className} w-72 border rounded`}>
            <table className={'w-full rounded overflow-hidden p-4'}>
                <tr className={'w-full px-2'}>
                    <Th>{title}</Th>
                </tr>
                <tr className={'w-full bg-white'}>
                    <Td>{val}</Td>
                </tr>
            </table>
        </div>
    )
}
