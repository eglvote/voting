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
        <div className={'mt-4'}>
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
                        <div className={''}>
                            <div className={'mt-2'}>
                                <p className={''}>
                                    <span>I want to vote with</span>
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
                                    <span className={'text-babyBlue'}>
                                        EGLs,
                                    </span>
                                    <span>{' locked for'}</span>
                                </p>
                                <div className={'flex items-baseline'}>
                                    <Field id="weeksLocked" name="weeksLocked">
                                        {({ field }) => (
                                            <select
                                                name="weeksLocked"
                                                {...field}
                                                className={
                                                    'w-12 border-babyBlue border-b mr-2'
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
                                    <p>
                                        {'In each of the'}
                                        <span className={'font-bold'}>
                                            {` ${weeksLocked} week(s)`}
                                        </span>
                                        {
                                            ', I want to vote for a desired gas limit'
                                        }
                                    </p>

                                    <div className={'flex'}>
                                        <p>{' of '}</p>
                                        <Field
                                            id="desiredChange"
                                            name="desiredChange"
                                        >
                                            {({ field }) => (
                                                <input
                                                    {...field}
                                                    className={
                                                        'w-32 border-babyBlue border-b text-right ml-2'
                                                    }
                                                    type="number"
                                                    placeholder=""
                                                />
                                            )}
                                        </Field>
                                        {'*'}
                                    </div>
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
                        <div className={'flex justify-end mt-2'}>
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
                                            : '/static/chevron-right.svg'
                                    }
                                />
                            </div>
                        </div>
                        {advanced && (
                            <div className={'w-full'}>
                                <div className={''}>
                                    <h1 className={'font-bold mb-2 text-xl'}>
                                        DAO
                                    </h1>

                                    <div
                                        className={
                                            'flex flex-col justify-items-center'
                                        }
                                    >
                                        <div className={'flex'}>
                                            <p>I want to send</p>
                                            <Field
                                                id="daoAmount"
                                                name="daoAmount"
                                            >
                                                {({ field }) => (
                                                    <input
                                                        {...field}
                                                        className={
                                                            'w-32 border-babyBlue border-b mr-2 text-right mx-2 px-4'
                                                        }
                                                        placeholder=""
                                                    />
                                                )}
                                            </Field>
                                            <p>from the DAO to</p>
                                            <Field
                                                id="daoAddress"
                                                name="daoAddress"
                                            >
                                                {({ field }) => (
                                                    <input
                                                        {...field}
                                                        className={
                                                            'w-32 border-babyBlue border-b mx-2'
                                                        }
                                                        placeholder=""
                                                    />
                                                )}
                                            </Field>{' '}
                                        </div>
                                        <div className={'flex items-end'}>
                                            <p className={'text-babyBlue'}>
                                                Ethereum wallet address.
                                            </p>
                                        </div>
                                    </div>
                                    <p className={'text-babyBlue'}></p>
                                </div>

                                <h1 className={'font-bold mt-4 mb-2 text-xl'}>
                                    EGL Contract
                                </h1>
                                <p>
                                    The EGL proxy should point to
                                    {/* <div className={'flex items-end'}> */}
                                    <Field
                                        id="contractAddress"
                                        name="contractAddress"
                                    >
                                        {({ field }) => (
                                            <input
                                                {...field}
                                                className={
                                                    'w-20 border-babyBlue border-b mx-2'
                                                }
                                                placeholder=""
                                            />
                                        )}
                                    </Field>
                                    <span className={'text-babyBlue'}>
                                        Ethereum contract address.
                                    </span>
                                </p>
                                {/* </div> */}
                            </div>
                        )}
                        <div className={'mt-4'}>
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
