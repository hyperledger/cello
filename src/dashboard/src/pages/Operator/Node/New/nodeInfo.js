import React, { Fragment, Suspense } from 'react';
import querystring from 'querystring';
import { Form, Button, message } from 'antd';
import { injectIntl, history, connect } from 'umi';

const FabricCa = React.lazy(() => import('./Fabric/ca'));
const FabricPeer = React.lazy(() => import('./Fabric/peer'));
const FabricOrderer = React.lazy(() => import('./Fabric/orderer'));

@connect(({ node, loading }) => ({
  node,
  creatingNode: loading.effects['node/createNode'],
}))
@Form.create()
class NodeInfo extends React.PureComponent {
  prevBtn = () => {
    const { location, intl } = this.props;
    const { query = {} } = location;
    const urlParams = querystring.stringify(query);
    return (
      <Button onClick={() => history.push(`/operator/node/new/basic-info?${urlParams}`)}>
        {intl.formatMessage({ id: 'form.button.prev', defaultMessage: 'Prev' })}
      </Button>
    );
  };

  createCallback = data => {
    if (data.id) {
      message.success('Create Node successfully');
      history.push('/operator/node');
    } else {
      message.error('Create Node Failed');
    }
  };

  onSubmit = data => {
    const { dispatch } = this.props;
    dispatch({
      type: 'node/createNode',
      payload: data,
      callback: this.createCallback,
    });
  };

  renderFabricForm = params => {
    const { creatingNode } = this.props;
    let formComponent = null;
    const {
      network_type: networkType,
      network_version: networkVersion,
      agent_type: agentType,
      type: nodeType,
    } = params;
    const componentProps = {
      prevBtn: this.prevBtn(),
      onSubmit: this.onSubmit,
      networkType,
      networkVersion,
      agentType,
      nodeType,
      creating: creatingNode,
    };
    switch (nodeType) {
      case 'ca':
      default:
        formComponent = <FabricCa {...componentProps} />;
        break;
      case 'peer':
        formComponent = <FabricPeer {...componentProps} />;
        break;
      case 'orderer':
        formComponent = <FabricOrderer {...componentProps} />;
        break;
    }
    return <Suspense fallback={null}>{formComponent}</Suspense>;
  };

  renderForm = () => {
    const { location } = this.props;
    const { query = {} } = location;
    const { network_type: networkType } = query;
    switch (networkType) {
      case 'fabric':
      default:
        return this.renderFabricForm(query);
    }
  };

  render() {
    const { renderForm } = this;
    return <Fragment>{renderForm()}</Fragment>;
  }
}

export default injectIntl(NodeInfo);
