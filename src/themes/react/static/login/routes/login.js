import React, { PropTypes } from 'react'
import { Button, Row, Col, Form, Input } from 'antd'
import { config } from '../utils'
import styles from './login.less'

const FormItem = Form.Item

const login = ({
    logging,
    loginButtonLoading,
    loginFail,
    onOk,
    form: {
        getFieldDecorator,
        validateFieldsAndScroll,
    },
}) => {
    function handleOk () {
        validateFieldsAndScroll((errors, values) => {
            if (errors) {
                return
            }
            onOk(values)
        })
    }

    return (
        <div className={styles.form}>
          <div className={styles.logo}>
            <span>
                CELLO
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
                })(<Input size="large" onPressEnter={handleOk} placeholder="Username" />)}
            </FormItem>
            <FormItem hasFeedback>
                {getFieldDecorator('password', {
                    rules: [
                        {
                            required: true,
                            message: 'Please input password',
                        },
                    ],
                })(<Input size="large" type="password" onPressEnter={handleOk} placeholder="Password" />)}
            </FormItem>
            <Row>
                {loginFail &&
                <Col span={24} style={{color: 'red'}}>
                    Validation failed
                </Col>
                }
              <Col span={24}>
                <Button type="primary" size="large" onClick={handleOk} loading={logging}>
                    Login
                </Button>
              </Col>
            </Row>
          </form>
        </div>
    )
}

login.propTypes = {
    form: PropTypes.object,
    loginButtonLoading: PropTypes.bool,
    onOk: PropTypes.func,
}

export default Form.create()(login)
