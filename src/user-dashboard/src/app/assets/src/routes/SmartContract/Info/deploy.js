/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { Component, Fragment } from 'react';
import {
  Card,
  Popover,
  Steps,
  Form,
  Select,
  Button,
  message,
  Input,
} from 'antd';
import classNames from 'classnames';
import styles from './index.less';

const { Step } = Steps;
const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
export default class Deploy extends Component {
  constructor(props) {
    super(props);
    const current = props.current || 0;
    const version = props.version || '';
    const versionId = props.versionId || '';
    this.state = {
      stepDirection: 'horizontal',
      current,
      version,
      versionId,
      chainName: '',
      chainId: '',
      deployId: '',
      installing: false,
      instantiating: false,
    }
  }
  changeVersion = value => {
    const { codes } = this.props;
    let codeVersion = this.state.version;
    codes.forEach(code => {
      if (code.objectId === value) {
        codeVersion = code.version;
        return false;
      }
    });
    this.setState({
      versionId: value,
      version: codeVersion,
    })
  };
  changeChain = value => {
    const { chains } = this.props;
    let { chainName } = this.state;
    chains.forEach(chain => {
      if (chain.objectId === value) {
        chainName = chain.name;
        return false;
      }
    });
    this.setState({
      chainId: value,
      chainName,
    })

  };
  installCallback = (response) => {
    if (response.success) {
      message.success('Install chain code successfully.');
      const current = this.state.current + 1;
      this.setState({
        current,
        deployId: response.deployId,
      });
    } else {
      message.error('Install chain code failed.');
    }
    this.setState({
      installing: false,
    })
  };
  instantiateCallback = (response) => {
    const { onDeployDone } = this.props;
    if (response.success) {
      message.success('Instantiate chain code successfully.');
      onDeployDone();
    } else {
      message.error('Instantiate chain code failed.');
    }
    this.setState({
      instantiating: false,
    })
  };
  next = () => {
    let { current } = this.state;
    const { chainId, versionId, deployId } = this.state;
    const { onDeploy } = this.props;
    const { installCallback, instantiateCallback } = this;
    switch (current) {
      case 1:
        this.setState({
          installing: true,
        }, () => {
          onDeploy({
            id: versionId,
            chainId,
            operation: 'install',
            callback: installCallback,
          });
        });
        break;
      case 2:
        this.props.form.validateFieldsAndScroll({ force: true }, (err, values) => {
          if (!err) {
            let { functionName, args } = values;
            functionName = functionName === "" ? null : functionName;
            args = args.split(',');
            this.setState({
              instantiating: true,
            }, () => {
              onDeploy({
                id: versionId,
                chainId,
                operation: 'instantiate',
                deployId,
                callback: instantiateCallback,
                functionName,
                args,
              })
            });
          }
        });
        break;
      default:
        current += 1;
        break;
    }
    this.setState({ current });
  };
  prev = () => {
    const current = this.state.current - 1;
    this.setState({ current });
  };

  render() {
    const { stepDirection, current, version, versionId, chainName, chainId, installing, instantiating } = this.state;
    const { chains, codes, currentSmartContract } = this.props;
    const { getFieldDecorator } = this.props.form;
    const defaultValues = currentSmartContract.default || {};
    const defaultParameters = defaultValues.parameters || {};
    const defaultInstantiateParameters = defaultParameters.instantiate ? defaultParameters.instantiate.join(",") : "";
    const versionOptions = codes.map(code => <Option value={code.objectId}>{code.version}</Option>);
    const chainOptions = chains.map(chain => <Option value={chain.objectId}>{chain.name}</Option>);
    const versionDesc = (
      <div className={classNames(styles.textSecondary, styles.stepDescription)}>
        <Fragment>
          {current > 0 && version}
        </Fragment>
      </div>
    );
    const chainDesc = (
      <div className={classNames(styles.textSecondary, styles.stepDescription)}>
        <Fragment>
          {current > 1 && chainName}
        </Fragment>
      </div>
    );
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 4 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 20 },
      },
    };

    const steps = [
      {
        title: 'Version',
        content: (
          <FormItem
            {...formItemLayout}
            label="Code Version"
          >
            <Select placeholder="Select a version to deploy" onChange={this.changeVersion} value={versionId} style={{width: 200}}>{versionOptions}</Select>
          </FormItem>
        ),
        description: versionDesc,
        help: 'Select code version to deploy',
      },
      {
        title: 'Install',
        content: (
          <FormItem
            {...formItemLayout}
            label="Chain"
          >
            <Select placeholder="Select a chain to install" onChange={this.changeChain} value={chainId} style={{width: 200}}>{chainOptions}</Select>
          </FormItem>
        ),
        description: chainDesc,
        help: 'Select network to install',
      },
      {
        title: 'Instantiate',
        content: (
          <div>
            <FormItem
              {...formItemLayout}
              label="Function Name"
            >
              {getFieldDecorator('functionName', {
                initialValue: '',
              })(<Input placeholder="Function" style={{width: '50%'}} />)}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="Arguments"
              extra="Must use ',' separate arguments."
            >
              {getFieldDecorator('args', {
                initialValue: defaultInstantiateParameters,
                rules: [
                  {
                    required: true,
                    message: 'Must input arguments',
                  },
                ],
              })(<Input placeholder="Arguments" style={{width: '50%'}} />)}
            </FormItem>
          </div>
        ),
        help: 'Input function & arguments to instantiate',
      },
    ];

    const popoverContent = (
      <div style={{ width: 160 }}>
        {steps[current].help}
      </div>
    );

    const customDot = (dot, { status }) =>
      status === 'process' ? (
        <Popover placement="topLeft" arrowPointAtCenter content={popoverContent}>
          {dot}
        </Popover>
      ) : (
        dot
      );

    function getNextText() {
      switch (current) {
        case 0:
          return 'Next';
        case 1:
          return 'Install';
        case 2:
          return 'Instantiate';
        default:
          return 'Next';
      }
    }
    function getLoading() {
      switch (current) {
        case 1:
          return installing;
        case 2:
          return instantiating;
        default:
          return false;
      }
    }
    function checkDisabled() {
      switch (current) {
        case 1:
          return chainId === '';
        default:
          return false;
      }
    }
    return (
      <Card
        title="Deploy Smart Contract"
        bordered={false}
      >
        <Steps direction={stepDirection} progressDot={customDot} current={current}>
          {steps.map(item => <Step key={item.title} title={item.title} description={item.description} />)}
        </Steps>
        <div className={styles["step-content"]}>
          <Form hideRequiredMark>
            {steps[current].content}
          </Form>
        </div>
        <div className={styles["step-button"]}>
          {
            current > 0
            && (
            <Button onClick={this.prev}>
              Previous
            </Button>
)}
          {
            (current < steps.length - 1 || current === steps.length - 1)
            &&
            <Button type="primary" disabled={checkDisabled()} loading={getLoading()} style={{ marginLeft: 18 }} onClick={this.next}>{getNextText()}</Button>
          }
        </div>
      </Card>
    );
  }
}
