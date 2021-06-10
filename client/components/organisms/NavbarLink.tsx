import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface NavBarLinkProps {
    style?: object
    className?: string
    name: string
}

export default function NavbarLink({
    style,
    className,
    name,
}: NavBarLinkProps) {
    const router = useRouter()
    const isCurrentPage =
        router.pathname.includes(name.toLowerCase()) ||
        (name === 'Genesis' && router.pathname === '/')
    // (name === 'Genesis' && router.pathname.includes('/'))

    return (
        // <Link href={`/${name}`}>
        <Link href={`/${name === 'Genesis' ? '' : name.toLowerCase()}`}>
            <div
                className={
                    'flex flex-col items-center justify-top cursor-pointer h-full hover:opacity-50'
                }
            >
                <a
                    style={style}
                    className={`${className} m-4 font-semibold text-white text-xl`}
                >
                    {name}
                </a>
                {isCurrentPage && (
                    <hr
                        style={{ width: '50%', marginTop: '-15px' }}
                        className={'border border-b-2 border-salmon'}
                    />
                )}
            </div>
        </Link>
    )
}
