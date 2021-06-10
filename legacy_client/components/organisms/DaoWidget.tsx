import React from 'react'
import { fromWei, displayComma, truncateEthAddress } from '../../lib/helpers'
import { JsxElement } from 'typescript'

interface DaoWidgetProps {
    style?: object
    className?: string
    daoAmount?: string
    daoRecipient?: string
    upgradeAddress?: string
}

interface TdProps {
    children: JsxElement | JsxElement[] | string
}

interface ThProps {
    children: JsxElement | JsxElement[] | string
    className?: string
}

const Td = ({ children }: TdProps) => (
    <td className={'text-left h-12'}>{children}</td>
)

const Th = ({ children, className }: ThProps) => (
    <th className={`${className} font-medium text-left`}>{children}</th>
)

export default function DaoWidget({
    style,
    className,
    daoAmount,
    daoRecipient,
    upgradeAddress,
}: DaoWidgetProps) {
    return (
        <div style={style} className={`${className} w-min`}>
            <div className={'flex justify-between px-8'}>
                <h1 className={'text-xl'}>DAO Allocation</h1>
                <h1 className={'text-xl'}>Contract Upgrade</h1>
            </div>
            <div className={'w-132 h-32 p-5 rounded-xl bg-white flex border'}>
                <div className={'w-3/5 flex items-center'}>
                    <table className={'w-full'}>
                        <tr>
                            <Th>{'Wallet'}</Th>
                            <Th>{'Amount'}</Th>
                        </tr>
                        <tr>
                            <Td>{truncateEthAddress(daoRecipient)}</Td>
                            <Td>{displayComma(fromWei(daoAmount))}</Td>
                        </tr>
                    </table>
                </div>
                <img className={'w-2'} src={'/static/verticalDots5.svg'} />
                <div className={'w-2/5 flex items-center pl-8'}>
                    <table className={'w-full'}>
                        <tr>
                            <Th className={'text-left'}>Contract Address</Th>
                        </tr>
                        <tr>
                            <td className={'text-left h-12'}>
                                {truncateEthAddress(upgradeAddress)}
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
    )
}
