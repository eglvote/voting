import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface NavBarLinkProps {
    style?: object
    className?: string
    name: string
}

export default function ({ style, className, name }: NavBarLinkProps) {
    const router = useRouter()
    const isCurrentPage = router.pathname.includes(name)

    return (
        <Link href={`/${name}`}>
            <div
                className={
                    'flex items-start cursor-pointer h-full hover:opacity-50'
                }
            >
                <a
                    style={style}
                    className={`${className} ${
                        isCurrentPage && 'text-salmon border-b-2 border-salmon'
                    } m-4 font-extrabold`}
                >
                    {name.toUpperCase()}
                </a>
            </div>
        </Link>
    )
}
