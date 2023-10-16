import React from 'react';
import { Card, Form, Input, Button, Select, message } from 'antd';
import { compose } from 'redux';
import { connect, withRouter, history, injectIntl } from 'umi';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
// import { getAuthority } from '@/utils/authority';

const FormItem = Form.Item;
const { Option } = Select;

@connect(({ network, loading }) => ({
  network,
  submitting: loading.effects['network/createNetwork'],
}))
class CreateNetwork extends React.Component {
  clickCancel = () => {
    history.push('/network');
  };

  submitCallback = data => {
    const { intl } = this.props;
    if (data.status === 'successful') {
      message.success(
        intl.formatMessage(
          {
            id: 'app.newNetwork.success',
            defaultMessage: 'Create network {name} success.',
          },
          {
            name: data.name,
          }
        )
      );
      history.push('/network');
    } else {
      message.error(
        intl.formatMessage(
          {
            id: 'app.newNetwork.fail',
            defaultMessage: 'Create network {name} fail.',
          },
          {
            name: data.name,
          }
        )
      );
    }
  };

  handleSubmit = values => {
    const { dispatch } = this.props;

    dispatch({
      type: 'network/createNetwork',
      payload: {
        ...values,
      },
      callback: this.submitCallback,
    });
  };

  render() {
    const { intl } = this.props;
    const { submitting } = this.props;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
        md: { span: 10 },
      },
    };

    const submitFormLayout = {
      wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 10, offset: 7 },
      },
    };
    const networkConsensus = ['etcdraft'];
    const networkConsensusOptions = networkConsensus.map(item => (
      <Option value={item} key={item}>
        <span>{item}</span>
      </Option>
    ));
    const networkDatabase = ['couchdb', 'leveldb'];
    const networkDatabaseOptions = networkDatabase.map(item => (
      <Option value={item} key={item}>
        <span>{item}</span>
      </Option>
    ));

    return (
      <PageHeaderWrapper
        title={intl.formatMessage({
          id: 'app.newNetwork.title',
          defaultMessage: 'New Network',
        })}
      >
        <Card bordered={false}>
          <Form
            onFinish={this.handleSubmit}
            onFinishFailed={this.onFinishFailed}
            hideRequiredMark
            style={{ marginTop: 8 }}
          >
            <FormItem
              {...formItemLayout}
              label={intl.formatMessage({
                id: 'app.newNetwork.label.name',
                defaultMessage: 'Name',
              })}
              name="name"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'app.newNetwork.required.Name',
                    defaultMessage: 'Please input name.',
                  }),
                },
              ]}
            >
              <Input
                placeholder={intl.formatMessage({
                  id: 'app.newNetwork.label.name',
                  defaultMessage: 'Name',
                })}
              />
            </FormItem>
            <FormItem
              {...formItemLayout}
              label={intl.formatMessage({
                id: 'app.newNetwork.label.consensus',
                defaultMessage: 'Consensus',
              })}
              name="consensus"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'app.newNetwork.required.consensus',
                    defaultMessage: 'Please select one consensus.',
                  }),
                },
              ]}
            >
              <Select>{networkConsensusOptions}</Select>
            </FormItem>
            <FormItem
              {...formItemLayout}
              label={intl.formatMessage({
                id: 'app.newNetwork.label.db',
                defaultMessage: 'Status Database',
              })}
              name="database"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'app.newNetwork.required.db',
                    defaultMessage: 'Please select one database.',
                  }),
                },
              ]}
            >
              <Select>{networkDatabaseOptions}</Select>
            </FormItem>

            <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
              <Button onClick={this.clickCancel}>
                {intl.formatMessage({ id: 'form.button.cancel', defaultMessage: 'Cancel' })}
              </Button>
              <Button
                loading={submitting}
                type="primary"
                htmlType="submit"
                style={{ marginLeft: 8 }}
              >
                {intl.formatMessage({ id: 'form.button.submit', defaultMessage: 'Submit' })}
              </Button>
            </FormItem>
          </Form>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default compose(withRouter, injectIntl)(CreateNetwork);
