import React from 'react'

interface CountdownProps {
    style?: object
    className?: string
    timeToNextEpoch: any
    epochLength: number
}

const Label = ({ children }) => (
    <p className={'text-xs text-white text-center my-1'}>{children}</p>
)

const Digit = ({ children, className }: any) => (
    <div className={`${className} text-white text-2xl text-center`}>
        {children}
    </div>
)

const Flex = ({ children }) => (
    <div className={'flex flex-col w-1/4 justify-center'}>{children}</div>
)

const Colon = () => (
    <div className={'h-full flex items-end text-white pb-1'}>:</div>
)

const formatDigit = (digit) => {
    const length = Math.abs(digit).toString().length
    return (
        <p>
            {length < 2 && <span className={'opacity-50'}>0</span>}
            {Math.abs(digit)}
        </p>
    )
}

export default function Countdown({
    style,
    className,
    timeToNextEpoch,
    epochLength,
}: CountdownProps) {
    const days = formatDigit(timeToNextEpoch.days())
    const hours = formatDigit(timeToNextEpoch.hours())
    const minutes = formatDigit(timeToNextEpoch.minutes())
    const seconds = formatDigit(timeToNextEpoch.seconds())

    const totalSeconds = timeToNextEpoch._milliseconds / 1000
    const totalEpochsBehind = Math.abs(Math.floor(totalSeconds / epochLength))

    return (
        <div
            style={style}
            className={`${className} w-80 h-32 bg-plum-dark rounded-xl p-2 px-4 flex items-end flex-col`}
        >
            {timeToNextEpoch._milliseconds > 0 ? (
                <>
                    <div className={'w-full mb-4'}>
                        <h1 className={'text-white font-sm text-center'}>
                            {'Next EGL epoch starts in'}
                        </h1>
                    </div>
                    <div
                        className={
                            'flex flex-col w-full p-2 -mt-2 justify-center items-center bg-plum rounded'
                        }
                    >
                        <div className={'flex justify-center w-full'}>
                            <Flex>
                                <Label>DAYS</Label>
                                <Digit>{days}</Digit>
                            </Flex>
                            <Colon />
                            <Flex>
                                <Label>HOURS</Label>
                                <Digit>{hours}</Digit>
                            </Flex>
                            <Colon />
                            <Flex>
                                <Label>MINUTES</Label>
                                <Digit>{minutes}</Digit>
                            </Flex>
                            <Colon />
                            <Flex>
                                <Label>SECONDS</Label>
                                <Digit>{seconds}</Digit>
                            </Flex>
                        </div>
                    </div>
                </>
            ) : (
                <div
                    className={
                        'w-full h-32 flex items-center justify-center mt-5  '
                    }
                >
                    <p
                        className={'font-extrabold text-2xl text-white'}
                    >{`Epoch is ${totalEpochsBehind} ${
                        totalEpochsBehind > 1 ? 'tallies' : 'tally'
                    } behind`}</p>
                </div>
            )}
        </div>
    )
}
