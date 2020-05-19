import React from 'react';
import { Form, Button } from 'antd';
import { useIntl } from 'umi';
import classNames from 'classnames';
import styles from '../styles.less';

const formItemLayout = {
  labelCol: {
    span: 5,
  },
  wrapperCol: {
    span: 19,
  },
};

@Form.create()
class FabricOrderer extends React.PureComponent {
  render() {
    const { prevBtn, creating } = this.props;
    const intl = useIntl();
    return (
      <Form layout="horizontal" className={classNames(styles.stepForm, styles.stepInputForm)}>
        <Form.Item
          wrapperCol={{
            xs: { span: 24, offset: 0 },
            sm: {
              span: formItemLayout.wrapperCol.span,
              offset: formItemLayout.labelCol.span,
            },
          }}
          label=""
        >
          {prevBtn}
          <Button type="primary" style={{ marginLeft: 8 }} loading={creating}>
            {intl.formatMessage({
              id: 'form.button.submit',
              defaultMessage: 'Submit',
            })}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

export default FabricOrderer;
