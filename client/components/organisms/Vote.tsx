import clsx from 'clsx'
import React from 'react'
import Button from '../atoms/Button'
import {
    BonusEglSupply,
    BPTSupply,
    launchTime,
    totalEglToBalancer,
    epochLengthSeconds,
} from '../lib/constants'
import { displayComma } from '../lib/helpers'
import m from 'moment'

interface VoteProps {
    style?: object
    className?: string
    children?: JSX.Element[] | JSX.Element
    contract: any
    contractBalance: string
    amountContributed: string
    web3: any
    contributorCumulativeBalance: string
}

export default function Vote({
    style,
    className,
    amountContributed,
    contract,
    contractBalance,
    children,
    contributorCumulativeBalance,
    web3,
}: VoteProps) {
    console.log(amountContributed, contractBalance)
    const ethBptRatio = BPTSupply / Number(web3.utils.fromWei(contractBalance))
    const bptDue = Number(amountContributed) * ethBptRatio
    const ethEglRatio = Number(contractBalance) / totalEglToBalancer
    const currentTime = m().unix()
    const timePassed = currentTime - launchTime - 10 * 7 * 24 * 60 * 60
    const x = Math.pow(timePassed, 4) * 750000000
    // console.log('x', x)
    const serializedEgl = Number(amountContributed) * ethEglRatio
    const firstEgl =
        (Number(web3.utils.fromWei(contributorCumulativeBalance)) -
            Number(amountContributed)) *
        ethEglRatio
    const lastEgl = firstEgl + serializedEgl

    // console.log(
    //     firstEgl,

    //     'firstEgl'
    // )
    // ((SECONDS_PASSED_SINCE_START - epochLength * minLiquidityTokensLockup)
    // /(epochLength * 52 - epochLength * minLiquidityTokensLockup))^4 * 750M
    const minLiquidityTokensLockup = epochLengthSeconds * 10
    console.log(m().unix() - launchTime)
    const y =
        ((m().unix() -
            launchTime -
            epochLengthSeconds * minLiquidityTokensLockup) /
            Math.pow(
                epochLengthSeconds * 52 -
                    epochLengthSeconds * minLiquidityTokensLockup,
                4
            )) *
        750000000
    console.log('xx', y)
    const daysSinceLaunch = m
        .duration(m.unix(m().unix()).diff(launchTime))
        .asDays()

    // console.log('daysSinceLaunch', daysSinceLaunch)
    const lockupPercentile = (timePassed / (365 - 70)) * 24 * 60 * 60

    const lastEglReleased = Math.pow(lockupPercentile, 4) * 750000000

    // const firstBptReleaseDate = Math.pow(firstEgl / 750000000, 1 / 4)
    // const lastBptReleaseDate = Math.pow(lastEgl / 750000000, 1 / 4)

    console.log(firstEgl / 750000000, lastEgl / 750000000)
    // console.log(firstBptReleaseDate, lastBptReleaseDate)
    const days = (firstEgl / totalEglToBalancer) ^ (0.25 * 295 + 70)

    const firstBptReleaseDate =
        m(launchTime)
            .add(days, 'days')
            .format('MM.DD') + '.21'
    const lastBptReleaseDate =
        m(launchTime)
            .add(365, 'days')
            .format('MM.DD') + '.22'

    // console.log(m(1620442541).format('MM-DD'), release)

    //     First BPT Release Date = (first_serialized_EGL / 750,000,000)^ (1/4)
    // Last BPT Release Date = (last_seralized_EGL) / 750,000,000)^ (1/4)
    // const firstSerialized = lastEglReleased -
    // const bptUnlocked = bptDue * (lastEglReleased - launchTime) / (stop-start)
    // console.log(contractBalance, bptDue, amountContributed)
    return (
        <>
            <div className={`${className} flex flex-row`}>
                <div style={style} className={'ml-4 w-96'}>
                    <p className={'text-3xl text-semibold text-white'}>
                        {'BPT Tokens'}
                    </p>
                    <p
                        className={clsx(
                            'text-4xl text-semibold w-auto inline-blockfont-bold ',
                            'bg-clip-text text-transparent bg-gradient-to-r from-pink to-pink-dark'
                        )}
                    >
                        {bptDue ? displayComma(bptDue) : '-'}
                    </p>
                    <p className={'text-xl text-semibold text-gray-400'}>
                        {`Unlock: ${firstBptReleaseDate} - ${lastBptReleaseDate}`}
                    </p>
                </div>
                <div style={style} className={'ml-4 w-96'}>
                    <p className={'text-3xl text-semibold text-white'}>
                        {'Bonus EGLs'}
                    </p>
                    <p
                        className={clsx(
                            'text-4xl text-semibold w-auto inline-blockfont-bold ',
                            'bg-clip-text text-transparent bg-gradient-to-r from-pink to-pink-dark'
                        )}
                    >
                        {amountContributed === '0'
                            ? '-'
                            : displayComma(
                                  (Number(amountContributed) /
                                      Number(
                                          web3.utils.fromWei(contractBalance)
                                      )) *
                                      BonusEglSupply
                              )}
                    </p>
                    <p className={'text-xl text-semibold text-gray-400'}>
                        {`Unlock: ${lastBptReleaseDate}`}
                    </p>
                </div>
            </div>
            <div className={'flex justify-center w-full -ml-12 mt-4'}>
                <Button
                    className={clsx(
                        'bg-salmon hover:bg-salmon-dark hover:text-white w-28 h-12 rounded-2xl text-dark'
                    )}
                    handleClick={() => {}}
                >
                    <p className={'font-semibold'}>Claim</p>
                </Button>
            </div>
        </>
    )
}
