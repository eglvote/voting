import React, { useState } from 'react'
import Modal from '../atoms/Modal'
import Button from '../atoms/Button'
import clsx from 'clsx'
import { useForm } from 'react-hook-form'
import { sendEth } from '../lib/contractMethods'
// import Spinner from '../molecules/Spinner'
// import NewSpinner from '../molecules/NewSpinner'
import Spin from '../molecules/Spin'
// import { Spin } from 'react-loading-io'

interface handleOutsideClickParameters {
    (): void
}

interface ParticipateModalProps {
    style?: object
    className?: string
    web3: any
    walletAddress: string
    contract: any
    handleOutsideClick: handleOutsideClickParameters
}

export default function ParticipateModal({
    style,
    className,
    web3,
    walletAddress,
    contract,
    handleOutsideClick,
}: ParticipateModalProps) {
    const [terms, setTerms] = useState(false)
    const [pending, setPending] = useState(false)
    const [error, setError] = useState(null)
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()
    const onSubmit = (data) => {
        sendEth(
            web3,
            contract,
            walletAddress,
            data.amount,
            () => setPending(true),
            (e) => setError(e)
        )
    }

    return (
        <Modal
            handleOutsideClick={handleOutsideClick}
            className={`${className} w-108 min-h-108 p-10 z-10 ${
                pending && 'overflow-hidden'
            }`}
            style={{ ...style }}
        >
            {pending ? (
                <div
                    style={{ minHeight: '40vh' }}
                    className={'flex justify-center items-center flex-col'}
                >
                    {error ? (
                        <>
                            <h1
                                className={clsx(
                                    'w-full text-xl text-center text-semibold mt-4',
                                    'inline-block font-bold bg-clip-text'
                                )}
                            >
                                {'Transaction Failed'}
                            </h1>
                            <p>{'Check Metamask for details'}</p>
                        </>
                    ) : (
                        <>
                            <Spin />
                            <>
                                <h1
                                    className={clsx(
                                        'w-full text-center mt-4 text-xl',
                                        'inline-block text-dark font-semibold'
                                    )}
                                >
                                    {'Transaction Pending...'}
                                </h1>
                            </>
                        </>
                    )}
                </div>
            ) : (
                <form
                    style={{ minHeight: '40vh' }}
                    onSubmit={handleSubmit(onSubmit)}
                    className={'flex flex-col justify-center items-center'}
                >
                    <h1
                        className={clsx(
                            'w-full text-4xl text-center text-semibold',
                            'inline-block font-bold bg-clip-text text-transparent',
                            'bg-gradient-to-r from-pink to-pink-dark'
                        )}
                    >
                        {'Amount'}
                    </h1>
                    <div
                        className={clsx(
                            'flex my-8 pl-2 flex-row bg-[#EAEAEA]',
                            'rounded-xl border h-12 w-full items-center'
                        )}
                    >
                        <p className={'text-xl ml-2'}>ETH｜</p>
                        <input
                            style={{ appearance: 'textfield' }}
                            {...register('amount')}
                            type='number'
                            step={0.001}
                            min={0.001}
                            // value={formValue}
                            // onChange={(e) =>
                            //     setFormValue(displayComma(e.target.value))
                            // }
                            placeholder='###'
                            className={'bg-[#EAEAEA] text-xl text-right'}
                        />
                    </div>
                    <div className={'flex flex-row items-center'}>
                        <input
                            className={'mr-4 cursor-pointer hover:opacity-50'}
                            name='terms'
                            defaultChecked={terms}
                            onChange={(e: any) => setTerms(e.target.checked)}
                            type='checkbox'
                        />
                        <p
                            onClick={() =>
                                window.open(
                                    'https://eglterms.s3-us-west-1.amazonaws.com/Terms+of+Service.pdf',
                                    '_blank'
                                )
                            }
                            className={
                                'text-[#8A8A8A] cursor-pointer hover:opacity-50'
                            }
                        >
                            {'Accept Terms & Conditions'}
                        </p>
                    </div>
                    <Button
                        className={clsx(
                            'my-8 py-2 px-12 bg-gradient-to-r',
                            terms && 'hover:from-pink-dark hover:to-pink',
                            'from-pink to-pink-dark rounded-3xl'
                        )}
                        disabled={!terms}
                        handleClick={() => {}}
                    >
                        <p className={'text-white text-xl text-semibold'}>
                            SUBMIT
                        </p>
                    </Button>
                    <p className={'text-[#8A8A8A] text-xs mb-3 mx-4'}>
                        {'Note: Each address can only participate once in the Genesis. ' +
                            'If you’d like to participate again, you will have to use a different address.'}
                    </p>
                </form>
            )}
        </Modal>
    )
}
