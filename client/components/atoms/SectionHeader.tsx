import React from 'react'
import styled from 'styled-components'

const SectionHeader = styled.h3`
    background-color: #3d3d3d;
    fontweight: bold;
    color: #ffffff;
`
interface SectionHeaderProps {
    style?: object
    children?: JSX.Element | JSX.Element[] | string
}
export default ({ style, children }: SectionHeaderProps) => (
    <SectionHeader style={style}>{children}</SectionHeader>
)
