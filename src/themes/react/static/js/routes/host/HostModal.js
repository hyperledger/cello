/**
 * Created by yuehaitao on 2017/2/9.
 */
import React, { PropTypes } from 'react'
import { Form, Input, InputNumber, Radio, Modal, Tooltip, Icon } from 'antd'
import validator from 'validator'
const FormItem = Form.Item

const modal = ({
    visible,
    item = {},
    onOk,
    onCancel,
    type,
    form: {
        getFieldDecorator,
        validateFields,
        getFieldsValue,
        setFields
    },
}) => {
    function handleOk() {
        validateFields((errors) => {
            if (errors) {
                return
            }
            const data = getFieldsValue()
            const url = data.url
            if (url.split(":").length !== 2) {
                setFields({
                    url: {
                        value: url,
                        errors: [new Error('Must input ip:port')]
                    }
                })
                return
            }
            const ip = url.split(":")[0]
            const port = parseInt(url.split(":")[1])
            if (!validator.isIP(ip)) {
                setFields({
                    url: {
                        value: url,
                        errors: [new Error('Must input valid ip address')]
                    }
                })
                return
            }
            if (port<0 || port>65535) {
                setFields({
                    url: {
                        value: url,
                        errors: [new Error('Must input valid port')]
                    }
                })
                return
            }
            onOk(data)
        })
    }

    let title = "Add Host"
    if (type === 'update') {
        title = "Update Host"
    }
    const modalOpts = {
        title: title,
        visible,
        onOk: handleOk,
        onCancel,
        wrapClassName: 'vertical-center-modal',
    }
    const formItemLayout = {
        labelCol: {
            span: 6,
        },
        wrapperCol: {
            span: 14,
        },
    }
    const portAfter = getFieldDecorator('port', {
        initialValue: type == "create" ? 1 : item.port,
        rules: [
            {
                required: true,
                message: 'Must select port'
            }
        ]
    })(<InputNumber min={1} />)

    return (
        <Modal {...modalOpts}>
            <Form horizontal>
                <FormItem label="Name" hasFeedback {...formItemLayout}>
                    {getFieldDecorator('name', {
                        initialValue: item.name,
                        rules: [
                            {
                                required: true,
                                message: 'Must input Host name',
                            },
                        ],
                    })(<Input />)}
                </FormItem>
                <FormItem label={<span>URL&nbsp;
                    <Tooltip title="Input the node ip and port, example: 192.168.1.1:6527">
                        <Icon type="question-circle-o" />
                    </Tooltip>
                </span>} hasFeedback {...formItemLayout}>
                    {getFieldDecorator('url', {
                        initialValue: item.daemon_url,
                        rules: [
                            {
                                required: true,
                                message: 'Must input Host url',
                            },
                        ],
                    })(<Input addonBefore="tcp://" />)}
                </FormItem>
                <FormItem label="Capacity" hasFeedback {...formItemLayout}>
                    {getFieldDecorator('capacity', {
                        initialValue: type == "create" ? 1 : item.capacity,
                        rules: [
                            {
                                required: true,
                                message: 'Must input capacity',
                            },
                        ],
                    })(<InputNumber min={1} />)}
                </FormItem>
            </Form>
        </Modal>
    )
}

modal.propTypes = {
    visible: PropTypes.any,
    form: PropTypes.object,
    item: PropTypes.object,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
    type: PropTypes.any
}

export default Form.create()(modal)
