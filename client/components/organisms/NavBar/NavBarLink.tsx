import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface NavBarLinkProps {
    style?: object
    className?: string
    href: string
    name: string
}

export default function ({ style, className, href, name }: NavBarLinkProps) {
    const router = useRouter()
    const isCurrentPage = router.pathname.includes(href)

    return (
        <Link href={href}>
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
                    {name}
                </a>
            </div>
        </Link>
    )
}
