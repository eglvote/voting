import React from 'react'
import styled from 'styled-components'

const SectionHeader = styled.h3`
    background-color: #3d3d3d;
    fontweight: bold;
    color: #ffffff;
`
export default ({ style, children }) => (
    <SectionHeader style={style}>{children}</SectionHeader>
)
