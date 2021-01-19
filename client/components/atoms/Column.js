import React from 'react'
import styled from 'styled-components'

const Column = styled.div`
  display: flex;
  flex-direction: column;
  width: 25%;
`
export default ({ style, children }) => (
  <Column style={style}>{children}</Column>
)
