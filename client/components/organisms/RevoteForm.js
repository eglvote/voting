import React, { useState } from 'react'
import styled from 'styled-components'
import { Formik, Field, Form } from 'formik'
import Row from '../atoms/Row'
import { revote } from '../../lib/contractMethods'
import SectionHeader from '../atoms/SectionHeader'

const FormRow = styled(Row)`
  margin: 1em;
  width: 9em;
`
const FormField = styled(Field)`
  width: 8em;
`
export default ({ contract, token, walletAddress }) => {
  const [txLink, setTsxLink] = useState(null)

  return (
    <div>
      <SectionHeader>Revote</SectionHeader>
      <Formik
        initialValues={{
          amount: '0',
          desiredChange: '0',
          weeksLocked: '0',
        }}
        onSubmit={async (values) => {
          if ((contract, token, walletAddress)) {
            const transactionReceipt = await revote(
              contract,
              token,
              walletAddress,
              values.amount,
              values.desiredChange,
              values.weeksLocked
            )
            setTsxLink(`etherscan.io/tx/${transactionReceipt.transactionHash}`)
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
          <button type="submit">Submit</button>
        </Form>
      </Formik>
      {txLink && <p>{txLink}</p>}
    </div>
  )
}
