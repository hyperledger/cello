
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by yuehaitao on 2017/2/9.
 */
import React, { PropTypes } from 'react'
import { Form, Input, InputNumber, Radio, Modal, Tooltip, Icon, Select, Switch } from 'antd'
import validator from 'validator'
const FormItem = Form.Item
const Option = Select.Option

class HostModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            posting: false,
            logType: 'local'
        }
        this.handleOk = this.handleOk.bind(this)
        this.logTypeChange = this.logTypeChange.bind(this)
    }
    logTypeChange(value) {
        this.setState({
            logType: value
        })
    }
    handleOk() {
        const {
            onOk,
            form: {
                validateFields,
                getFieldsValue,
                setFields
            },
            item,
            type
        } = this.props
        validateFields((errors) => {
            if (errors) {
                return
            }
            let data = getFieldsValue()
            const url = data.daemon_url
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
            this.setState({
                posting: true
            });
            if (!('log_server' in data)) {
                data.log_server = '';
            }
            if (type !== 'create') {
                data.id = item.id
            }
            onOk(data)
        })
}
    render() {
        const {
            visible,
            item = {},
            onCancel,
            type,
            form: {
                getFieldDecorator,
            },
        } = this.props
        const {posting, logType} = this.state
        let title = "Add Host"
        if (type === 'update') {
            title = "Update Host"
        }
        const modalOpts = {
            title: title,
            visible,
            onOk: this.handleOk,
            onCancel,
            confirmLoading: posting,
            okText: 'Confirm',
            cancelText: 'Cancel',
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

        return (
            <Modal {...modalOpts}>
                <Form layout="horizontal">
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
                        {getFieldDecorator('daemon_url', {
                            initialValue: type === "create" ? "" : item.daemon_url.split("//")[1],
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
                            initialValue: type === "create" ? 1 : item.capacity,
                            rules: [
                                {
                                    required: true,
                                    message: 'Must input capacity',
                                },
                            ],
                        })(<InputNumber min={1} />)}
                    </FormItem>
                    <FormItem label="Log Level" hasFeedback {...formItemLayout}>
                        {getFieldDecorator('log_level', {
                            initialValue: type === "create" ? "DEBUG" : item.log_level,
                            rules: [
                                {
                                    required: true,
                                    message: 'Must Select Log level',
                                },
                            ],
                        })(<Select>
                            <Option value="DEBUG">DEBUG</Option>
                            <Option value="INFO">INFO</Option>
                            <Option value="NOTICE">NOTICE</Option>
                            <Option value="WARNING">WARNING</Option>
                            <Option value="ERROR">ERROR</Option>
                            <Option value="CRITICAL">CRITICAL</Option>
                        </Select>)}
                    </FormItem>
                    <FormItem label="Log Type" hasFeedback {...formItemLayout}>
                        {getFieldDecorator('log_type', {
                            initialValue: type === "create" ? "local" : item.log_type,
                            rules: [
                                {
                                    required: true,
                                    message: 'Must Select Log type',
                                },
                            ],
                        })(<Select onChange={this.logTypeChange}>
                            <Option value="local">LOCAL</Option>
                            <Option value="syslog">SYSLOG</Option>
                        </Select>)}
                    </FormItem>
                    {logType === 'syslog' &&
                    <FormItem label="Log Server" hasFeedback {...formItemLayout}>
                        {getFieldDecorator('log_server', {
                            initialValue: type === 'create' ? '' : item.log_server,
                            rules: [
                                {
                                    required: logType === 'syslog',
                                    message: 'Must input Log Server',
                                },
                            ],
                        })(<Input />)}
                    </FormItem>
                    }
                    <FormItem label={<span>Schedulable&nbsp;
                        <Tooltip title="Schedulable for cluster request">
                        <Icon type="question-circle-o" />
                    </Tooltip>
                </span>} hasFeedback {...formItemLayout}>
                        {getFieldDecorator('schedulable', {
                            initialValue: type === 'create' ? false : item.schedulable === "true",
                            valuePropName: 'checked'
                        })(<Switch />)}
                    </FormItem>
                    <FormItem label={<span>Keep filled&nbsp;
                        <Tooltip title="Keep filled with cluster">
                        <Icon type="question-circle-o" />
                    </Tooltip>
                </span>} hasFeedback {...formItemLayout}>
                        {getFieldDecorator('autofill', {
                            initialValue: type === 'create' ? false : item.autofill === "true",
                            valuePropName: 'checked'
                        })(<Switch />)}
                    </FormItem>
                </Form>
            </Modal>
        )
    }
}

HostModal.propTypes = {
    visible: PropTypes.any,
    form: PropTypes.object,
    item: PropTypes.object,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
    type: PropTypes.any
}

export default Form.create()(HostModal)
