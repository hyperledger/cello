import React, { PropTypes } from 'react'
import { Button, Row, Col, Form, Input } from 'antd'
import styles from './login.less'

const FormItem = Form.Item

class Register extends React.Component {
    constructor(props) {
        super(props)
    }
    handleOk = () => {
        const {onOk, form: {
            validateFieldsAndScroll
        }} = this.props;
        validateFieldsAndScroll((errors, values) => {
            if (errors) {
                return
            }
            onOk(values)
        })
    }
    validateConfirmPassword = (rule, value, callback) => {
        const {form: {getFieldValue}} = this.props
        if (value && value !== getFieldValue('password')) {
            callback('Two input password must be consistent')
        }
        callback()
    }
    render() {
        const {
            registering,
            registerFail,
            onClickSignIn,
            form: {
                getFieldDecorator
            },
        } = this.props;
        return (
            <div className={styles.form}>
                <div className={styles.logo}>
            <span style={{width: 60}}>
                <img width="100%" src="/static/images/logo.svg" />
            </span>
                </div>
                <form>
                    <FormItem hasFeedback>
                        {getFieldDecorator('username', {
                            initialValue: '',
                            rules: [
                                {
                                    required: true,
                                    message: 'Please input username',
                                },
                            ],
                        })(<Input size="large" onPressEnter={this.handleOk} placeholder="Username" />)}
                    </FormItem>
                    <FormItem hasFeedback>
                        {getFieldDecorator('password', {
                            initialValue: '',
                            rules: [
                                {
                                    required: true,
                                    message: 'Please input password',
                                },
                            ],
                        })(<Input size="large" type="password" onPressEnter={this.handleOk} placeholder="Password" />)}
                    </FormItem>
                    <FormItem hasFeedback>
                        {getFieldDecorator('confirm_password', {
                            initialValue: '',
                            rules: [
                                {
                                    required: true,
                                    message: 'Please input password',
                                },
                                {
                                    validator: this.validateConfirmPassword
                                }
                            ],
                        })(<Input size="large" type="password" onPressEnter={this.handleOk} placeholder="Confirm Password" />)}
                    </FormItem>
                    <Row>
                        {registerFail &&
                        <Col span={24} style={{color: 'red'}}>
                            Validation failed
                        </Col>
                        }
                        <Col span={24}>
                            <Button type="primary" size="large" onClick={this.handleOk} loading={registering}>
                                Sign Up
                            </Button>
                        </Col>
                        <Col span={24} style={{textAlign: 'center', fontSize: 14, marginTop: 10}}>
                            Already have an account? <a onClick={onClickSignIn}>Sign in</a>
                        </Col>
                    </Row>
                </form>
            </div>
        )
    }
}

Register.propTypes = {
    form: PropTypes.object,
    loginButtonLoading: PropTypes.bool,
    onOk: PropTypes.func,
}

export default Form.create()(Register)
