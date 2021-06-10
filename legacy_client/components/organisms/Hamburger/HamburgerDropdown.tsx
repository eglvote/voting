import React, { useRef } from 'react'
import useOutsideClick from '../../hooks/UseOutsideClick'
import { capitalize } from '../../../lib/helpers'
import { useRouter } from 'next/router'

interface handleClickParameters {
    (): void
}

interface HamburgerDropdownProps {
    links: string[]
    handleClick: handleClickParameters
}

const MenuItem = ({ onClick, name }) => {
    const router = useRouter()
    const isCurrentPage = router.pathname.includes(name)

    return (
        <li
            onClick={onClick}
            className={`hover:bg-gray-200 hover:text-black ${
                isCurrentPage
                    ? 'bg-gray-200 text-black underline'
                    : 'text-white'
            } cursor-pointer p-2 pl-4 font-bold`}
        >
            {capitalize(name)}
        </li>
    )
}

export default function HamburgerDropdown({
    links,
    handleClick,
}: HamburgerDropdownProps) {
    const router = useRouter()

    const ref = useRef(null)
    useOutsideClick(ref, handleClick)

    return (
        <div
            ref={ref}
            className={
                'bg-plum blur opacity-60 absolute mt-24 ml-4 border border-gray-300 w-52 rounded-xl shadow-xl overflow-hidden'
            }
        >
            <ul>
                {links.map((link) => (
                    <MenuItem
                        onClick={() => router.push(`/${link}`)}
                        name={link}
                    />
                ))}
            </ul>
        </div>
    )
}
