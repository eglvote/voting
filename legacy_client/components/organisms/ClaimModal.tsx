import React, { useState } from 'react'
import Modal from '../atoms/Modal'
import { Formik, Field, Form } from 'formik'
import Button from '../atoms/Button'
import { fromWei } from '../../lib/helpers'
import BigNumber from 'bignumber.js'
import { supportLaunch } from '../../lib/contractMethods'

interface handleOutsideClickParameters {
    (): void
}

interface ClaimModalProps {
    style?: object
    className?: string
    contract: any
    walletAddress: string
    ethEglRatio: string
    handleOutsideClick: handleOutsideClickParameters
}

const safeGetMatch = (amount, ethEglRatio) => {
    if (
        amount < 0.000001 ||
        isNaN(amount) ||
        amount === '' ||
        amount <= 0 ||
        !amount ||
        ethEglRatio <= 0 ||
        !ethEglRatio
    ) {
        return 0
    }
    const result = fromWei(
        new BigNumber(ethEglRatio).multipliedBy(new BigNumber(amount)).toFixed()
    )

    return result
}
export default function ClaimModal({
    style,
    className,
    contract,
    walletAddress,
    ethEglRatio,
    handleOutsideClick,
}: ClaimModalProps) {
    const [amount, setAmount] = useState('')

    const match = safeGetMatch(amount, ethEglRatio)

    return (
        <Modal
            handleOutsideClick={handleOutsideClick}
            className={`${className} w-96 p-6 z-10`}
            style={style}
        >
            <div>
                <h1
                    className={
                        'text-xl text-salmon font-bold border-b-2 border-salmon'
                    }
                >
                    CLAIM
                </h1>
                <div>
                    <Formik
                        initialValues={{
                            amount: '0',
                        }}
                        onSubmit={(values, actions) => {
                            supportLaunch(contract, walletAddress, amount, () =>
                                handleOutsideClick()
                            )
                        }}
                    >
                        <Form>
                            <div className={'flex justify-center items-center'}>
                                <div className={'mt-4'}>
                                    <div className={'flex items-baseline'}>
                                        <p>I want to send</p>
                                        <Field id="amount" name="amount">
                                            {({ field }) => (
                                                <input
                                                    {...field}
                                                    className={
                                                        'w-24 border-babyBlue border-b mx-2 text-right'
                                                    }
                                                    type="number"
                                                    placeholder=""
                                                    value={amount}
                                                    onChange={(e) =>
                                                        setAmount(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            )}
                                        </Field>
                                        <span className={'text-babyBlue'}>
                                            {'ETH'}
                                        </span>
                                        <p className={'ml-1'}>{'to the'}</p>
                                    </div>
                                    <p>{'EGL contract'}</p>
                                    <p className={'mt-4'}>
                                        {
                                            'This ETH will be matched by an estimated ~'
                                        }
                                    </p>
                                    <p>
                                        <span
                                            className={
                                                'border-babyBlue border-b'
                                            }
                                        >
                                            {match}
                                        </span>
                                        {
                                            ' EGL and sent to the ETH-EGL Uniswap Pool.'
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className={'flex mt-4 w-full justify-center'}>
                                <Button type={'submit'}>
                                    <p>Submit</p>
                                </Button>
                            </div>
                        </Form>
                    </Formik>
                </div>
            </div>
        </Modal>
    )
}
