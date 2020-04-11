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



const CreateForm = Form.create()(props => {
    const { modalVisible,
        form,
        handleModalVisible,
        handleAdd,
        renderTreeNodes,
        
        onChange,
        onExpand,
        expandedKeys,
        autoExpandParent,
        selectedKeys,
        onSelect,
        AffData,
        getAff,
        
    } = props;
    const okHandle = () => {
        form.validateFields((err, fieldsValue) => {
            if (err) return;
            form.resetFields();
            handleAdd(fieldsValue);
        });
    };
    
    console.log('selectedKeys');
    console.log(selectedKeys);
    
    
    
    
    return (
        <Modal
            title="Affiliation"
            visible={modalVisible}
            onok={okHandle}
            onCancel={() => handleModalVisible()}
        >
            <div>
                <Search style={{marginBottom:8}} placeholder='Search' onChange={onChange} />
                <Tree
                    onExpand={onExpand}
                    expandedKeys={expandedKeys}
                    autoExpandParent={autoExpandParent}
                    selectedKeys={selectedKeys}
                    onSelect={onSelect}
                >
                    {renderTreeNodes(AffData)}
                </Tree>
            </div>
            {/*  <FormItem
                labelCol={{ span: 5 }} w rapperCol={{ span: 15 }} label="用户名称" >
                {form.getFieldDecorator('name', {
                    initialValue: '',
                })(<span>123</span>)}
            </FormItem>   */}
        </Modal>
    );
});


@connect(({OrgUserList,loading }) => ({
    OrgUserList,
    loading: loading.models.OrgUserList,
    submitting: loading.effects['OrgUserList/createOrgUser'],
}))
@Form.create()
export default class extends PureComponent {
    state = {
        modalVisible: false,
        expandedKeys:[],
        autoExpandParent:true,
        searchValue:'',
        selectedKeys:[],
        
    };
    
    componentWillMount() {
        this.props.dispatch({
            type: 'OrgUserList/getAffiliation',
        });
    }
    
    clickCancel = () => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'OrgUserList',
            })
        );
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
    
    
    onSelect = (selectedKeys,info)=>{
        console.log('onSelect',info);
        this.setState({selectedKeys});
    };
    
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
    
    
    InsertAff(target, Affs, index){
        
        let j = 0;
        for (;j < Affs.length;j++) {
            if (Affs[j].title === target[index]) {
                break;
            }
        }
        if (j === Affs.length) {
            console.log('j');
            console.log(j);
            console.log('j');
            let key = '';
            for (let i = 0;i <= index;i++) {
                if (i > 0) {
                    key += '.';
                }
                key += target[i];
            }
            Affs.push({
                title: target[index],
                key: key
            });
            
            if (index + 1 !== target.length) {
                this.InsertAff(target, Affs, index);
            }
        }
        else {
            
            if (typeof(Affs[j].children) === 'undefined') {
                console.log(1111);
                Affs[j].children = [];
            }
            console.log('Affs2');
            console.log(Affs[j]);
            this.InsertAff(target, Affs[j].children, index + 1);
        }
    };
    
    
    AffiliationData(getAffili){
        if( Array.isArray(getAffili)){
            const Affs =[];
            for(let i=0; i<getAffili.length;i++){
                if (getAffili[i] !== '') {
                    this.InsertAff(getAffili[i].split("."), Affs, 0);
                }
            }
            console.log('Affs');
            console.log(Affs);
            return Affs;
        }
        else {
            return [];
        }
        
    };
    
    
    
    handleModalVisible = (flag) => {
        this.setState({
            modalVisible: !!flag,
        });
    };
    
    render() {
        const {
            OrgUserList:{getAffili},
            submitting,
        }=this.props;
        const {getFieldDecorator} = this.props.form;
        
        const {
            modalVisible,
        } = this.state;
        
        console.log('getAffili');
        console.log(getAffili);
        console.log('AffiliationData');
        console.log(this.AffiliationData(getAffili));
        const  DataAff=this.AffiliationData(getAffili);
        const parentMethods = {
            handleAdd: this.handleAdd,
            handleModalVisible: this.handleModalVisible,
            ModalVisible:this.ModalVisible,
            searchValue:this.state.searchValue,
            onChange:this.onChange,
            onExpand:this.onExpand,
            renderTreeNodes:this.renderTreeNodes,
            expandedKeys:this.state.expandedKeys,
            autoExpandParent:this.state.autoExpandParent,
            onSelect:this.onSelect,
            selectedKeys:this.state.selectedKeys,
            getAff:getAffili,
            AffData:DataAff,
            //  onCheck:this.onCheck,
            //  checkedKeys:this.state.checkedKeys,
            //  onSelect:this.onSelect,
            //  selectedKeys:this.state.selectedKeys,
            //  renderTreeNodes:this.renderTreeNodes,
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


