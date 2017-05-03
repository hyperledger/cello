/**
 * Created by yuehaitao on 2017/2/9.
 */
import React, { PropTypes } from 'react'
import { Form, Input, InputNumber, Radio, Modal, Tooltip, Icon, Select, Switch } from 'antd'
import validator from 'validator'
const FormItem = Form.Item
const Option = Select.Option

class ClusterModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            posting: false,
            pluginType: 'noops',
        }
        this.handleOk = this.handleOk.bind(this)
        this.pluginChange = this.pluginChange.bind(this)
    }
    pluginChange(value) {
        this.setState({
            pluginType: value
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
        validateFields((errors, values) => {
            if (!errors) {
                this.setState({
                    posting: true
                });
                values.consensus_mode = "batch"
                onOk(values)
            }
        })
}
    render() {
        const {
            visible,
            item = {},
            onCancel,
            form: {
                getFieldDecorator,
            },
            hosts,
        } = this.props
        const {posting, pluginType} = this.state
        let title = "Add Chain"
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
        const hostsOptions = hosts.map((host, i) =>
            <Option value={host.id}>{host.name}</Option>
        )
        return (
            <Modal {...modalOpts}>
                <Form layout="horizontal">
                    <FormItem label="Name" hasFeedback {...formItemLayout}>
                        {getFieldDecorator('name', {
                            rules: [
                                {
                                    required: true,
                                    message: 'Must input Host name',
                                },
                            ],
                        })(<Input />)}
                    </FormItem>
                    <FormItem label="Host" hasFeedback {...formItemLayout}>
                        {getFieldDecorator('host_id', {
                            rules: [
                                {
                                    required: true,
                                    message: 'Must select host',
                                },
                            ],
                        })(<Select>
                            {hostsOptions}
                        </Select>)}
                    </FormItem>
                    <FormItem label="Chain Size" hasFeedback {...formItemLayout}>
                        {getFieldDecorator('size', {
                            initialValue: 4,
                            rules: [
                                {
                                    required: true,
                                    message: 'Must Select Chain size',
                                },
                            ],
                        })(<Select>
                            <Option value={4}>4</Option>
                            <Option value={6}>6</Option>
                        </Select>)}
                    </FormItem>
                    <FormItem label="Consensus Plugin" hasFeedback {...formItemLayout}>
                        {getFieldDecorator('consensus_plugin', {
                            initialValue: 'noops',
                            rules: [
                                {
                                    required: true,
                                    message: 'Must Select Consensus Plugin',
                                },
                            ],
                        })(<Select onChange={this.pluginChange}>
                            <Option value="noops">NOOPS</Option>
                            <Option value="pbft">PBFT</Option>
                        </Select>)}
                    </FormItem>
                    {pluginType === 'pbft' &&
                    <FormItem label="Consensus Mode" hasFeedback {...formItemLayout}>
                        {getFieldDecorator('consensus_mode', {
                            initialValue: 'batch',
                            rules: [
                                {
                                    required: pluginType === 'pbft',
                                    message: 'Must Select Consensus Mode',
                                },
                            ],
                        })(<Select>
                            <Option value="batch">BATCH</Option>
                        </Select>)}
                    </FormItem>
                    }
                </Form>
            </Modal>
        )
    }
}

ClusterModal.propTypes = {
    visible: PropTypes.any,
    form: PropTypes.object,
    item: PropTypes.object,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
    type: PropTypes.any
}

export default Form.create()(ClusterModal)
