import React, { useState } from 'react'
import { Formik, Field, Form } from 'formik'
import { vote } from '../../../lib/contractMethods'
import Button from '../../atoms/Button'
import { MAXIMUM_LOCKUP_PERIODS } from '../../../lib/constants'

interface VoteFormProps {
    contract: any
    token: any
    walletAddress: any
}

export default function VoteModalForm({
    contract,
    token,
    walletAddress,
}: VoteFormProps) {
    const lockupOptions = [...Array(MAXIMUM_LOCKUP_PERIODS).keys()].map(
        (i) => i + 1
    )
    const [weeksLocked, setWeeksLocked] = useState('1')

    return (
        <div>
            <Formik
                initialValues={{
                    amount: '0',
                    desiredChange: '0',
                    weeksLocked: '1',
                }}
                onSubmit={(values) => {
                    vote(
                        contract,
                        token,
                        walletAddress,
                        values.amount,
                        values.desiredChange,
                        weeksLocked
                    )
                }}
            >
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
                                                'w-16 border-babyBlue border-b mx-2 '
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
                                                setWeeksLocked(e.target.value)
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
                                <p className={'text-babyBlue'}>{'week(s).'}</p>
                            </div>
                            <div className={'mt-4'}>
                                <p>{`In each of the ${weeksLocked} week(s), I want`}</p>
                                <p>to vote for a desired gas limit of</p>
                                <Field id="desiredChange" name="desiredChange">
                                    {({ field }) => (
                                        <input
                                            {...field}
                                            className={
                                                'w-32 border-babyBlue border-b'
                                            }
                                            type="number"
                                            placeholder=""
                                        />
                                    )}
                                </Field>
                                *
                            </div>
                        </div>
                    </div>
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
            </Formik>
        </div>
    )
}
