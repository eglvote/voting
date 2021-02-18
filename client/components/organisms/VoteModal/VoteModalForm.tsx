import React, { useState } from 'react'
import { Formik, Field, Form } from 'formik'
import { vote } from '../../../lib/contractMethods'
import Button from '../../atoms/Button'
import {
    MAXIMUM_LOCKUP_PERIODS,
    GAS_TARGET_LIMIT,
} from '../../../lib/constants'
import * as Yup from 'yup'

interface VoteFormProps {
    contract: any
    token: any
    walletAddress: any
    baselineEgl: any
    handleOutsideClick: any
}

export default function VoteModalForm({
    contract,
    token,
    walletAddress,
    baselineEgl,
    handleOutsideClick,
}: VoteFormProps) {
    const lockupOptions = [...Array(MAXIMUM_LOCKUP_PERIODS).keys()].map(
        (i) => i + 1
    )
    const [weeksLocked, setWeeksLocked] = useState('1')
    const [advanced, setAdvanced] = useState(false)

    const VoteModalSchema = Yup.object().shape({
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
                    weeksLocked: '1',
                    daoAddress: '',
                    daoAmount: '0',
                    upgradeAddress: '',
                }}
                validationSchema={VoteModalSchema}
                onSubmit={(values) => {
                    vote(
                        contract,
                        token,
                        walletAddress,
                        values.amount,
                        values.desiredChange,
                        weeksLocked,
                        values.daoAddress,
                        values.daoAmount,
                        values.upgradeAddress,
                        () => handleOutsideClick()
                    )
                }}
            >
                {({ errors, touched }) => (
                    <Form>
                        <div className={'flex justify-center items-center'}>
                            <div className={'mt-4'}>
                                <div className={'flex items-baseline'}>
                                    <p>I want to vote with</p>
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
                                    <p className={'text-babyBlue'}>EGLs,</p>
                                </div>
                                <div className={'flex items-baseline'}>
                                    <p>locked for</p>
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
                                                        e.target.value
                                                    )
                                                }}
                                            >
                                                {lockupOptions.map((i) => (
                                                    <option
                                                        value={String(i)}
                                                        label={String(i)}
                                                        key={i}
                                                    />
                                                ))}
                                            </select>
                                        )}
                                    </Field>
                                    <p className={'text-babyBlue'}>
                                        {'week(s).'}
                                    </p>
                                </div>
                                <div className={'mt-4'}>
                                    <p>{`In each of the ${weeksLocked} week(s), I want`}</p>
                                    <p>
                                        {'to vote for a desired gas limit of'}
                                    </p>
                                    <Field
                                        id="desiredChange"
                                        name="desiredChange"
                                    >
                                        {({ field }) => (
                                            <input
                                                {...field}
                                                className={
                                                    'w-32 border-babyBlue border-b text-right'
                                                }
                                                // validate={validateDesiredChange}
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
                                                'w-full border border-black'
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
                            <Button type={'submit'} disabled={false}>
                                <p>Submit</p>
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    )
}
