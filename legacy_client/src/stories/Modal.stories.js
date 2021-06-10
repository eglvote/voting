import React from 'react'
import Modal from '../../components/atoms/Modal.tsx'

export default {
    title: 'Example/Modal',
    component: Modal,
}

const Default = () => (
    <Modal>
        <div className={'w-64 h-64'}>
            <p>hello</p>
        </div>
    </Modal>
)

export const ModalExample = Default.bind({})
