import React, { PureComponent } from 'react';
import { Card, Form, Input, Button,Select,Icon,Tree,Modal,Col } from 'antd';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import PropTypes from 'prop-types';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import StandardFormRow from '../../components/StandardFormRow';

const FormItem = Form.Item;
const {TreeNode}=Tree;
const { Option } = Select;
const Search = Input.Search;


const x=3;
const y=2;
const z=1;
const gData=[];

const generateData=(_level,_preKey,_tns)=>{
    const preKey=_preKey ||'0';
    const tns=_tns || gData;
    const children=[];
    for(let i=0;i<x;i++){
        const key=`${preKey}-${i}`;
    tns.push({titile:key,key});
        if(i<y){
            children.push(key);
        }
    }

    if(_level<0){
        return tns;
    }
    const level=_level-1;
    children.forEach((key,index)=>{
        tns[index].children=[];
        return generateData(level,key,tns[index].children);
    });
};
    generateData(z);

    const dataList=[];
    const generateList = (data)=>{
        for(let i=0;i<data.length;i++){
            const node = data[i];
            const key =node.key;
            dataList.push({key,title:key});
            if(node.children){
                generateList(node.children,node.key);
            }
        }
    };
    generateList(gData);

    const getParentKey =(key,tree)=>{
      let parentKey;
      for(let i=0;i<tree.length;i++){
          const node=tree[i];
          if (node.children){
              if(node.children.some(item=>item.key===key)){
                  parentKey=node.key;
              }
              else if(getParentKey(key.node.children)){
                  parentKey = getParentKey(key,node.children);
              }
          }
      }
      return parentKey;
    };


const treeData=[{
    title:'0-0',
    key:'0-0',
    children:[{
        title:'0-0-0',
        key:'0-0-0',
        children:[
            {title:'0-0-0-0',key:'0-0-0-0'},
            {title:'0-0-0-1',key:'0-0-0-1'},
            {title:'0-0-0-2',key:'0-0-0-2'},
        ],
    },
        {
            title:'0-0-1',
            key:'0-0-1',
            children:[
                {title:'0-0-1-0',key:'0-0-1-0'},
                {title:'0-0-1-1',key:'0-0-1-1'},
                {title:'0-0-1-2',key:'0-0-1-2'},
            ],
        },
        {
            title:'0-0-2',
            key:'0-0-2',
        }],
},
    {
        title:'0-1',
        key:'0-1',
        children:[
            {title:'0-1-0-0',key:'0-1-0-0'},
            {title:'0-1-0-1',key:'0-1-0-1'},
            {title:'0-1-0-2',key:'0-1-0-2'},
        ],
    },
    {
        title:'0-2',
        key:'0-2',
    }];

const CreateForm = Form.create()(props => {
    const { modalVisible,
            form,
            handleModalVisible,
            handleAdd,
            renderTreeNodes,
            onSelect,
            onCheck,
            onExpand,
            expandedKeys,
            autoExpandParent,
            checkedKeys,
            selectedKeys,
    } = props;
    const okHandle = () => {
        form.validateFields((err, fieldsValue) => {
            if (err) return;
            form.resetFields();
            handleAdd(fieldsValue);
        });
    };

    const submitFormLayout = {
        wrapperCol: {
            xs: { span: 24, offset: 0 },
            sm: { span: 10, offset: 7 },
        },
    };


    return (
        <Modal
            title="Affiliation"
            visible={modalVisible}
            onok={okHandle}
            onCancel={() => handleModalVisible()}
        >
            <Tree
                checkable
                onExpand={onExpand}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                onCheck={onCheck}
                checkedKeys={checkedKeys}
                onSelect={onSelect}
                selectedKeys={selectedKeys}
            >
                {renderTreeNodes(treeData)}
            </Tree>
            <FormItem
                labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="用户名称" >
                {form.getFieldDecorator('name', {
                    initialValue: '',
                })(<span>123</span>)}
            </FormItem>
        </Modal>
    );
});


@connect(({OrgUserList,loading }) => ({
    OrgUserList,
    submitting: loading.effects['OrgUserList/createOrgUser'],
}))
@Form.create()
export default class  extends PureComponent {
    state = {
        modalVisible: false,
        expandedKeys:['0-0-0','0-0-1'],
        autoExpandParent:true,
        checkedKeys:['0-0-0'],
        selectedKeys:[],
    };

    componentWillMount() {
       /* this.props.dispatch({
            type: 'OrgUserList/fetch',      // 获取创建通道时各个字段的选项信息
        });  */
    }

    clickCancel = () => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'OrgUserList',
            })
        );
    };

    handleAdd = (fields) => {
        const {dispatch} = this.props;
        const orguser={name};
        orguser.name=fields.name;
        orguser.active=`${(this.state.activeState)}`;
        dispatch({
            type: 'OrgUserList/updateOrgUser',
            payload: {
                orguser: orguser,
            },
        });
        this.setState({
            modalVisible: false,
        });
    };

    onExpand=(expandedKeys)=>{
        console.log('onExpand',expandedKeys);
        this.setState({
            expandedKeys,
            autoExpandParent: false,
        })
    };

    onCheck =(checkedKeys)=>{
        console.log('onCheck',checkedKeys);
        this.setState({checkedKeys});
    };

    onSelect = (selectedKeys,info)=>{
        console.log('onSelect',info);
        this.setState({selectedKeys});
    };

    renderTreeNodes =data => data.map((item)=>{
        if(item.children) {
            return(
                <TreeNode title={item.title} key={item.key} dataRef={item}>
                    {this.renderTreeNodes(item.children)}
                </TreeNode>
            );
        }
        return<TreeNode {...item}  />
    });

    handleSubmit = e => {
        const org=window.username.split('@');
        const orgDomain='@'+org[1];
        e.preventDefault();
        this.props.form.validateFieldsAndScroll({ force: true }, (err, values) => {
            if (!err) {
                if(values.password===values.rePassword){
                    const orguser = {
                            "name":         values.name+orgDomain,
                            "role":         values.role ,
                            "password":     values.password,
                            "delegateRoles": "peer",
                            "affiliation":  "org1.department1",
                            "affiliationMgr":"true",
                            "revoker":        "true",
                            "gencrl":         "true",

                    };

                    this.props.dispatch({
                        type:    'OrgUserList/createOrgUser',
                        payload:  {orguser},
                    });
                }
                else{
                    message.success('两次输入的密码不一致');
                }

            }
        });
    };


    handleModalVisible = (flag) => {
        this.setState({
            modalVisible: !!flag,
        });
    };

  render() {
    const {
        submitting,
        }=this.props;
    const {getFieldDecorator} = this.props.form;

    const {  modalVisible } = this.state;
    const parentMethods = {
          handleAdd: this.handleAdd,
          handleModalVisible: this.handleModalVisible,
          ModalVisible:this.ModalVisible,

          onExpand:this.onExpand,
          expandedKeys:this.state.expandedKeys,
          autoExpandParent:this.state.autoExpandParent,
          onCheck:this.onCheck,
          checkedKeys:this.state.checkedKeys,
          onSelect:this.onSelect,
          selectedKeys:this.state.selectedKeys,
          renderTreeNodes:this.renderTreeNodes,
      };

    const formItemLayout = {
        labelCol: {
            xs: {span: 24},
            sm: {span: 7},
        },
        wrapperCol: {
            xs: {span: 24},
            sm: {span: 12},
            md: {span: 10},
        },
    };

      const submitFormLayout = {
          wrapperCol: {
              xs: {span: 24, offset: 0},
              sm: {span: 10, offset: 14},
          },
      };

    /*  const OrgRole = [
          {
              id: 'org_admin',
              name: '管理员',
          },
          {
              id: 'org_user',
              name: '操作员',
          },

      ];   */
      const OrgRole = [
          {
              id: 'peer',
              name: 'peer',
          },
          {
              id: 'orderer',
              name: 'orderer',
          },
          {
              id: 'client',
              name: 'client',
          },

      ];

      const org=window.username.split('@');
      const orgDomain='@'+org[1];


    return (
        <PageHeaderLayout
            title="创建用户"
            content={'创建用户时，通道的名称或描述可加入具体业务关键信息，以便后续使用。'}
            logo={<Icon type="user" style={{fontSize: 30, color: '#722ed1'}} />}
        >
            <Card bordered={false}>
                <Form onSubmit={this.handleSubmit} hideRequiredMark style={{marginTop: 8}}>
                    <FormItem
                        {...formItemLayout}
                        label="用户名称"
                    >
                        {getFieldDecorator('name', {
                            initialValue: '',
                            rules: [
                                {
                                    required: true,
                                    message: '请选择用户名称',
                                },
                            ],
                        })(<div >
                            <Input style={{ width: '30%'}} placeholder="请输入用户名称"/>
                            <span>{orgDomain}</span>
                           </div>)}
                    </FormItem>
                    <FormItem {...formItemLayout} label="角色">
                        {getFieldDecorator('role', {
                            initialValue: '',
                            rules: [
                                {
                                    required: true,
                                    message: '请选择用户角色',
                                },
                            ],
                        })(
                            <Select
                                placeholder="请选择用户角色"
                            >
                                {OrgRole.map(OrgRole => (
                                    <Option key={OrgRole.id} value={OrgRole.id}>
                                        {OrgRole.name}
                                    </Option>
                                ))}
                            </Select >
                        )}
                    </FormItem>
                    <FormItem {...formItemLayout} label="affiliation">
                        {getFieldDecorator('affiliation', {
                            initialValue: '',
                        })(
                            <a  onClick={() => this.handleModalVisible(true)}>选择</a>
                        )}
                    </FormItem>
                    <FormItem {...formItemLayout} label="密码">

                                        {getFieldDecorator('password', {
                                            rules: [
                                                {
                                                    required: true,
                                                    message: '请输入密码',
                                                },
                                            ],
                                        })(<Input type="password" style={{maxWidth: 515, width: '100%'}} placeholder="请输入用户密码"/>)}

                    </FormItem>
                    <FormItem {...formItemLayout} label="重复密码">

                        {getFieldDecorator('rePassword', {
                            rules: [
                                {
                                    required: true,
                                    message: '请再输入一次新密码',
                                },
                            ],
                        })(<Input type="password" style={{maxWidth: 515, width: '100%'}} placeholder="请再输入一次新密码"/>)}

                    </FormItem>
                    <FormItem {...submitFormLayout} style={{marginTop: 32}}>
                        <Button onClick={this.clickCancel}>
                        取消
                        </Button>
                        <Button loading={submitting} type="primary" htmlType="submit" style={{marginLeft: 10}}>
                        提交
                        </Button>
                    </FormItem>
                </Form>
            </Card>
            <CreateForm {...parentMethods} modalVisible={modalVisible} />
        </PageHeaderLayout>
    );
  };
}


