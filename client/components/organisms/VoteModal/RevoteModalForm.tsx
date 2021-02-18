import React, { useState } from 'react'
import { Formik, Field, Form } from 'formik'
import { revote } from '../../../lib/contractMethods'
import Button from '../../atoms/Button'
import {
    MAXIMUM_LOCKUP_PERIODS,
    GAS_TARGET_LIMIT,
} from '../../../lib/constants'
import m from 'moment'
import { fromWei, displayComma } from '../../../lib/helpers'
import * as Yup from 'yup'

interface VoteFormProps {
    contract: any
    token: any
    walletAddress: any
    releaseDate: any
    epochLength: string
    callback: any
    tokensLocked: any
    voterReward: any
    baselineEgl: any
}

export default function RevoteModalForm({
    contract,
    token,
    walletAddress,
    releaseDate,
    epochLength,
    callback,
    tokensLocked,
    voterReward,
    baselineEgl,
}: VoteFormProps) {
    let lockupOptions = [...Array(MAXIMUM_LOCKUP_PERIODS).keys()]
        .map((x) => x + 1)
        .filter((x) => releaseDate < m().unix() + Number(epochLength) * x)

    if (!lockupOptions.length) lockupOptions.push(8)

    const [weeksLocked, setWeeksLocked] = useState(lockupOptions[0] || 1)
    const [advanced, setAdvanced] = useState(false)

    const RevoteModalSchema = Yup.object().shape({
        desiredChange: Yup.number()
            .min(baselineEgl - GAS_TARGET_LIMIT, 'Too low!')
            .max(baselineEgl + GAS_TARGET_LIMIT, 'Too high!'),
    })

    return (
        <div>
            <Formik
                initialValues={{
                    amount: '0',
                    desiredChange: '0',
                    weeksLocked: weeksLocked,
                    daoAddress: '',
                    daoAmount: '0',
                    upgradeAddress: '',
                }}
                validationSchema={RevoteModalSchema}
                onSubmit={(values) => {
                    revote(
                        contract,
                        token,
                        walletAddress,
                        values.amount,
                        values.desiredChange,
                        weeksLocked,
                        values.daoAddress,
                        values.daoAmount,
                        values.upgradeAddress,
                        () => callback()
                    )
                }}
            >
                {({ errors, touched }) => (
                    <Form>
                        <div className={'mt-4'}>
                            <div>
                                <div>
                                    <div className={'flex items-baseline'}>
                                        <p>I want to add</p>
                                        <Field id="amount" name="amount">
                                            {({ field }) => (
                                                <input
                                                    {...field}
                                                    className={
                                                        'w-32 border-babyBlue border-b mx-2 text-right'
                                                    }
                                                    type="number"
                                                    placeholder=""
                                                />
                                            )}
                                        </Field>
                                        <p>
                                            {
                                                <span
                                                    className={'text-babyBlue'}
                                                >
                                                    additional EGLs
                                                </span>
                                            }
                                            {', to my vote'}
                                        </p>
                                    </div>
                                    <p>
                                        {' of '}
                                        {
                                            <span className={'font-bold'}>
                                                {displayComma(
                                                    Number(
                                                        fromWei(tokensLocked)
                                                    ) + Number(voterReward)
                                                )}
                                                {' EGLs.'}
                                            </span>
                                        }
                                    </p>
                                </div>
                                <div className={'flex items-baseline mt-4'}>
                                    <p>I will lock my vote for</p>
                                    <Field id="weeksLocked" name="weeksLocked">
                                        {({ field }) => (
                                            <select
                                                name="weeksLocked"
                                                {...field}
                                                className={
                                                    'w-12 border-babyBlue border-b mx-2'
                                                }
                                                value={weeksLocked}
                                                onChange={(e) => {
                                                    setWeeksLocked(
                                                        Number(e.target.value)
                                                    )
                                                }}
                                            >
                                                {lockupOptions.map((i) => {
                                                    return (
                                                        <option
                                                            value={String(i)}
                                                            label={String(i)}
                                                            key={i}
                                                        />
                                                    )
                                                })}
                                            </select>
                                        )}
                                    </Field>
                                    <p className={'text-babyBlue'}>
                                        {'week(s).'}
                                    </p>
                                </div>
                                <div className={'mt-4'}>
                                    <p>
                                        {'In each of the '}
                                        <span
                                            className={'font-bold'}
                                        >{`${weeksLocked} week(s)`}</span>
                                        {
                                            ', I want to vote for a desired gas limit of'
                                        }
                                        <Field
                                            id="desiredChange"
                                            name="desiredChange"
                                        >
                                            {({ field }) => (
                                                <input
                                                    {...field}
                                                    className={
                                                        'w-32 border-babyBlue border-b ml-2 text-right'
                                                    }
                                                    type="number"
                                                    placeholder=""
                                                />
                                            )}
                                        </Field>
                                        {'*'}
                                        {errors.desiredChange &&
                                            touched.desiredChange && (
                                                <span
                                                    className={
                                                        'ml-2 text-salmon-dark'
                                                    }
                                                >
                                                    {errors.desiredChange}
                                                </span>
                                            )}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className={'flex justify-end mt-4'}>
                            <div
                                onClick={() => setAdvanced(!advanced)}
                                className={'flex cursor-pointer'}
                            >
                                <p>Advanced Options</p>
                                <img
                                    className={'ml-2'}
                                    src={
                                        advanced
                                            ? '/static/chevron-down.svg'
                                            : '/static/chevron-up.svg'
                                    }
                                />
                            </div>
                        </div>
                        {advanced && (
                            <div>
                                <h1 className={'font-bold mb-4 text-xl'}>
                                    DAO
                                </h1>
                                <div
                                    className={
                                        'flex flex-col justify-items-start'
                                    }
                                >
                                    <p>DAO Allocation ETH Address</p>
                                    <Field id="daoAddress" name="daoAddress">
                                        {({ field }) => (
                                            <input
                                                {...field}
                                                className={
                                                    'w-full border border-black'
                                                }
                                                placeholder=""
                                            />
                                        )}
                                    </Field>
                                    <p className={'mt-2'}>DAO Amount</p>
                                    <div className={'flex'}>
                                        <Field id="daoAmount" name="daoAmount">
                                            {({ field }) => (
                                                <input
                                                    {...field}
                                                    className={
                                                        'w-4/5 border border-black'
                                                    }
                                                    placeholder=""
                                                />
                                            )}
                                        </Field>
                                        <p className={'ml-2'}>EGLs</p>
                                    </div>
                                </div>
                                <h1 className={'font-bold mt-4 mb-2 text-xl'}>
                                    EGL Contract
                                </h1>
                                <p>New Contract Address</p>
                                <Field
                                    id="contractAddress"
                                    name="contractAddress"
                                >
                                    {({ field }) => (
                                        <input
                                            {...field}
                                            className={
                                                'w-full border border-black text-right'
                                            }
                                            placeholder=""
                                        />
                                    )}
                                </Field>
                            </div>
                        )}
                        <div className={'mt-8'}>
                            <p className={'text-xs'}>
                                * Voters can always use re-vote to change their
                                vote. See documentation for more information
                            </p>
                        </div>
                        <div className={'flex mt-4 w-full justify-center'}>
                            <Button type={'submit'}>
                                <p>Submit</p>
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    )
}
