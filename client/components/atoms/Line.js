import React from 'react'
import styled from 'styled-components'

const Line = styled.div`
  width: 25em;
  margin-top: 1em;
  border-bottom: 1px solid lightgrey;
`
export default ({ style }) => <Line style={style} />
