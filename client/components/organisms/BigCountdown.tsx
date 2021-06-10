import React, { useState, useEffect } from 'react'
import { zeroPad } from '../lib/helpers'
import m from 'moment'
import { launchTime } from '../lib/constants'

interface CountdownProps {
    style?: object
    className?: string
    children?: JSX.Element[] | JSX.Element
}

interface DigitProps {
    num: number
    label: string
    className?: string
    style?: object
}

const Digit = ({ num, label, className, style }: DigitProps) => (
    <div
        style={style}
        className={`${className} w-52 mr-4 ml-2 border-white border-r-2 flex flex-col justify-center`}
    >
        <div className={'mb-4 '}>
            <p
                style={{ fontSize: '6em' }}
                className={'text-salmon text-5xl text-center'}
            >
                {zeroPad(String(num), 2)}
            </p>
        </div>
        <div className={'text-[#C0C0C0] text-3xl text-center'}>{label}</div>
    </div>
)

export default function Countdown({
    style,
    className,
    children,
}: CountdownProps) {
    const [days, setDays] = useState(0)
    const [hours, setHours] = useState(0)
    const [minutes, setMinutes] = useState(0)
    const [seconds, setSeconds] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            const end = launchTime
            const now = m().unix()
            const timeLeft = m.unix(end - now)

            setDays(m.unix(end).diff(m.unix(now), 'days'))
            setHours(timeLeft.hours())
            setMinutes(timeLeft.minutes())
            setSeconds(timeLeft.seconds())
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div
            style={style}
            className={`${className} w-full flex flex-row justify-center`}
        >
            <Digit className={'ml-0'} num={days} label={'days'} />
            <Digit num={hours} label={'hours'} />
            <Digit num={minutes} label={'minutes'} />
            <Digit
                style={{ border: 'none' }}
                className={'border-0'}
                num={seconds}
                label={'seconds'}
            />
        </div>
    )
}
