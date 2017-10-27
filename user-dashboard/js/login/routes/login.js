import React, { PropTypes } from 'react'
import { Button, Row, Col, Form, Input } from 'antd'
import { config } from '../utils'
import styles from './login.less'

const FormItem = Form.Item

class Login extends React.Component {
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
    render() {
        const {
            logging,
            loginButtonLoading,
            loginFail,
            onOk,
            onClickSignUp,
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
                            rules: [
                                {
                                    required: true,
                                    message: 'Please input password',
                                },
                            ],
                        })(<Input size="large" type="password" onPressEnter={this.handleOk} placeholder="Password" />)}
                    </FormItem>
                    <Row>
                        {loginFail &&
                        <Col span={24} style={{color: 'red'}}>
                            Validation failed
                        </Col>
                        }
                        <Col span={24}>
                            <Button type="primary" size="large" onClick={this.handleOk} loading={logging}>
                                Login
                            </Button>
                        </Col>
                        <Col span={24} style={{textAlign: 'center', fontSize: 14, marginTop: 10}}>
                            Don't have an account? <a onClick={onClickSignUp}>Sign up</a>
                        </Col>
                    </Row>
                </form>
            </div>
        )
    }
}

Login.propTypes = {
    form: PropTypes.object,
    loginButtonLoading: PropTypes.bool,
    onOk: PropTypes.func,
}

export default Form.create()(Login)
