import React, { PropTypes } from 'react'
import { Form, Input, Modal } from 'antd'
const { TextArea } = Input;
const FormItem = Form.Item
import isEmail from 'validator/lib/isEmail';
import isURL from 'validator/lib/isURL';

const formItemLayout = {
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 14,
  },
}

class ProfileModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
        posting: false
    }
    this.handleOk = this.handleOk.bind(this)
  }
  postCallback = () => {
     this.setState({
         posting: false
     })
  }
  handleOk = () => {
    const {form: {validateFields}, onOk} = this.props
      const _that = this;
      validateFields((errors, values) => {
          if (errors) {
              return
          }
          _that.setState({
              posting: true
          })
          onOk({
              ...values,
              callback: this.postCallback
          })
      })
  }
  validateEmail = (rule, value, callback) => {
    if (value && !isEmail(value)) {
      callback('Please input valid email address')
    }
    callback()
  }
  validateUrl = (rule, value, callback) => {
    if (value && !isURL(value)) {
      callback('Please input valid URL address')
    }
    callback()
  }
  render() {
      const {
          visible,
          item = {},
          onCancel,
          form: {
              getFieldDecorator,
          },
      } = this.props
      const {posting} = this.state
      const modalOpts = {
          title: "Update Profile",
          visible,
          onOk: this.handleOk,
          onCancel,
          confirmLoading: posting,
          okText: 'Confirm',
          cancelText: 'Cancel',
          wrapClassName: 'vertical-center-modal',
      }
      return (
          <Modal {...modalOpts}>
            <Form layout="horizontal">
                <FormItem
                    {...formItemLayout}
                    label="Name"
                    hasFeedback
                >
                    {getFieldDecorator('name', {
                        initialValue: item.name ? item.name : ''
                    })(
                        <Input />
                    )}
                </FormItem>
                <FormItem
                    {...formItemLayout}
                    label="Email"
                    hasFeedback
                >
                    {getFieldDecorator('email', {
                        initialValue: item.email ? item.email : '',
                        rules: [
                            {
                                validator: this.validateEmail
                            }
                        ]
                    })(
                        <Input />
                    )}
                </FormItem>
                <FormItem
                    {...formItemLayout}
                    label="Organization"
                    hasFeedback
                >
                    {getFieldDecorator('bio', {
                        initialValue: item.bio ? item.bio : ''
                    })(
                        <TextArea row={2} />
                    )}
                </FormItem>
                <FormItem
                    {...formItemLayout}
                    label="URL"
                    hasFeedback
                >
                    {getFieldDecorator('url', {
                        initialValue: item.url ? item.url : '',
                        rules: [
                            {
                                validator: this.validateUrl
                            }
                        ]
                    })(
                        <Input />
                    )}
                </FormItem>
                <FormItem
                    {...formItemLayout}
                    label="Location"
                    hasFeedback
                >
                    {getFieldDecorator('location', {
                        initialValue: item.location ? item.location : ''
                    })(
                        <Input />
                    )}
                </FormItem>
            </Form>
          </Modal>
      )
  }
}

ProfileModal.propTypes = {
  form: PropTypes.object.isRequired,
  visible: PropTypes.bool,
  item: PropTypes.object,
  onCancel: PropTypes.func,
  onOk: PropTypes.func,
}

export default Form.create()(ProfileModal)
