import React from 'react'
import styled from 'styled-components'
import { Formik, Field, Form } from 'formik'
import Row from '../atoms/Row'
import {
    supportLaunch,
    withdrawLiquidityTokens,
} from '../../lib/contractMethods'
import SectionHeader from '../atoms/SectionHeader'

const FormRow = styled(Row)`
    margin: 1em;
    width: 9em;
`
const FormField = styled(Field)`
    width: 8em;
    border: 1px solid black;
`
// const Button = styled.button`
//     border: 1px solid black;
//     padding: 5px;
//     border-radius: 5px;
//     margin-top: 1em;
// `
export default function SupportLaunchForm({ contract, walletAddress }) {
    return (
        <div>
            <SectionHeader>{'Support Launch'}</SectionHeader>
            <Formik
                initialValues={{
                    amount: '0',
                }}
                onSubmit={async (values) => {
                    if (!walletAddress) {
                        alert('Please connect to metamask')
                    } else if (!values.amount) {
                        alert('Please enter an amount')
                    } else {
                        supportLaunch(contract, walletAddress, values.amount)
                    }
                }}
            >
                <Form>
                    <FormRow>
                        <label htmlFor="amount">Eth Amount</label>
                    </FormRow>
                    <FormRow>
                        <FormField
                            type="number"
                            id="amount"
                            name="amount"
                            placeholder="0"
                        />
                    </FormRow>
                    <button style={{ 'margin-top': '1em' }} type="submit">
                        Submit
                    </button>
                </Form>
            </Formik>
            <button
                style={{ 'margin-top': '1em' }}
                onClick={() => withdrawLiquidityTokens(contract, walletAddress)}
            >
                Withdraw Liquidity Tokens
            </button>
        </div>
    )
}
