import React, { useState } from 'react'
import styled from 'styled-components'
import { Formik, Field, Form } from 'formik'
import Row from '../atoms/Row'
import { vote, revote } from '../../lib/contractMethods'
import SectionHeader from '../atoms/SectionHeader'

const FormRow = styled(Row)`
    margin: 1em;
    width: 9em;
`
const FormField = styled(Field)`
    width: 8em;
    border: 1px solid black;
`
const Button = styled.button`
    border: 1px solid black;
    padding: 5px;
    padding-left: 1em;
    padding-right: 1em;
    border-radius: 5px;
    margin-top: 1em;
`
export default ({ contract, token, walletAddress, hasNotVoted }) => {
    const [txLink, setTsxLink] = useState(null)

    return (
        <div>
            <SectionHeader style={{ marginTop: '1em', marginBottom: '1em' }}>
                {hasNotVoted ? 'Vote' : 'Revote'}
            </SectionHeader>
            <Formik
                initialValues={{
                    amount: '0',
                    desiredChange: '0',
                    weeksLocked: '0',
                }}
                onSubmit={async (values) => {
                    if ((contract, token, walletAddress)) {
                        const transactionReceipt = (await hasNotVoted)
                            ? vote(
                                  contract,
                                  token,
                                  walletAddress,
                                  values.amount,
                                  values.desiredChange,
                                  values.weeksLocked
                              )
                            : revote(
                                  contract,
                                  token,
                                  walletAddress,
                                  values.amount,
                                  values.desiredChange,
                                  values.weeksLocked
                              )
                        // transactionReceipt &&
                        //     setTsxLink(
                        //         `etherscan.io/tx/${transactionReceipt.transactionHash}`
                        //     )
                    } else {
                        alert('Connect to Metamask!')
                    }
                }}
            >
                <Form>
                    <FormRow>
                        <label htmlFor="amount">Amount</label>
                    </FormRow>
                    <FormRow>
                        <FormField
                            type="number"
                            id="amount"
                            name="amount"
                            placeholder="0"
                        />
                    </FormRow>
                    <FormRow>
                        <label>Desired Change</label>
                    </FormRow>
                    <FormRow>
                        <FormField
                            type="number"
                            id="desiredChange"
                            name="desiredChange"
                            placeholder="0"
                        />
                    </FormRow>
                    <FormRow>
                        <label htmlFor="weeksLocked">Weeks Locked</label>
                    </FormRow>
                    <FormRow>
                        <FormField
                            type="number"
                            id="weeksLocked"
                            name="weeksLocked"
                            placeholder="0"
                        />
                    </FormRow>
                    <Button className={'hover:bg-gray-300'} type="submit">
                        Submit
                    </Button>
                </Form>
            </Formik>
            {/* {txLink && <p>{txLink}</p>} */}
        </div>
    )
}