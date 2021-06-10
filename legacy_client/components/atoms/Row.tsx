import React from 'react'
import styled from 'styled-components'

const Row = styled.div`
    display: flex;
    flex-direction: row;
`
export default ({ style, children }) => <Row style={style}>{children}</Row>
