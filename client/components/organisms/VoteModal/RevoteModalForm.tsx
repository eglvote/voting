import React, { useState } from 'react'
import { Formik, Field, Form } from 'formik'
import { revote } from '../../../lib/contractMethods'
import Button from '../../atoms/Button'
import {
    SECONDS_IN_EPOCH,
    MAXIMUM_LOCKUP_PERIODS,
} from '../../../lib/constants'
import m from 'moment'

interface VoteFormProps {
    contract: any
    token: any
    walletAddress: any
    releaseDate: any
}

export default function RevoteModalForm({
    contract,
    token,
    walletAddress,
    releaseDate,
}: VoteFormProps) {
    const lockupOptions = [...Array(MAXIMUM_LOCKUP_PERIODS).keys()]
        .map((x) => x + 1)
        .filter((x) => releaseDate < m().unix() + SECONDS_IN_EPOCH * x)

    const [weeksLocked, setWeeksLocked] = useState(lockupOptions[0] || 1)

    return (
        <div className={'mx-8'}>
            <Formik
                initialValues={{
                    amount: '0',
                    desiredChange: '0',
                    weeksLocked: weeksLocked,
                }}
                onSubmit={(values) => {
                    revote(
                        contract,
                        token,
                        walletAddress,
                        values.amount,
                        values.desiredChange,
                        values.weeksLocked
                    )
                }}
            >
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
                                                    'w-32 border-babyBlue border-b mx-2 '
                                                }
                                                type="number"
                                                placeholder=""
                                            />
                                        )}
                                    </Field>
                                    <p className={'text-babyBlue'}>
                                        additional EGLs,
                                    </p>
                                </div>
                                <p>
                                    {'to my vote of (number of locked EGLs +'}
                                </p>
                                <p>{'rewards) EGLs.'}</p>
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
