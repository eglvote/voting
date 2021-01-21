import React from 'react'
import styled from 'styled-components'
import { Formik, Field, Form, isEmptyArray } from 'formik'
import Column from '../atoms/Column'
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
export default ({ contract, token, walletAddress }) => (
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
          revote(
            contract,
            token,
            walletAddress,
            values.amount,
            values.desiredChange,
            values.weeksLocked
          )
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
          <FormField type="number" id="amount" name="amount" placeholder="0" />
        </FormRow>
        <Column role="group">
          <label>Desired Change</label>
          <label>
            <Field type="radio" name="desiredChange" value="0" />
            {' +1,000,000 (up)'}
          </label>
          <label>
            <Field type="radio" name="desiredChange" value="1" />
            {' 0 (same)'}
          </label>
          <label>
            <Field type="radio" name="desiredChange" value="2" />
            {' -1,000,000 (down)'}
          </label>
        </Column>

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
  </div>
)
