/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */

Vue.prototype.unixMoment = function (time) {
    return moment.unix(time).format("YYYY/MM/DD HH:mm:ss")
};
const users = new Vue({
    el: '#users',
    data: {
        labelCol: {
            span: 6
        },
        wrapperCol: {
            span: 14
        },
        userForm: {
            username: '',
            password: '',
            role: 0,
            active: true,
            balance: 0
        },
        visible: false,
        method: 'create',
        users: [],
        currentUser: {},
        rolesShown: ["admin", "operator", "user"],
        activeChoices: [
            {
                value: 1,
                text: "Yes"
            },
            {
                value: 0,
                text: "No"
            }
        ],
        roles: [
            {
                value: 0,
                label: "admin"
            },
            {
                value: 1,
                label: "operator"
            },
            {
                value: 2,
                label: "user"
            }
        ],
        rules: {
            username: [
                { required: true, message: 'Please input username', trigger: 'blur' }
            ],
            password: [
                { required: true, message: 'Please input password', trigger: 'blur' }
            ]
        },
        loadData: function (params) {
            return axios.get("/api/user/list", {params: params}).then(res =>{
                return res.data.users;
            });
        },
        columns: [
            {title:"User Name", field:'name'},
            {title:"Role", field:'role', sort: true},
            {title:"Balance", field:'balance', sort: true},
            {title:"Create Time", field:'timestamp', sort: true},
            {title:"Operation", field: 'id'}
        ],
        operations: function(item) {
            return [
                {content: 'edit', item: item},
                {content: 'delete', item: item, divided: true}
            ]
        },
        handling: false
    },
    methods: {
        showModal: function () {
            this.userForm = {
                username: "",
                password: "",
                role: 0,
                active: true
            }
            this.handling = false;
            this.method = 'create';
            this.visible = true;
        },
        handleCancel: function () {
            this.visible = false
        },
        handleOk: function () {
            this.$refs.userForm.validate(valid => {
                if (valid) {
                    var formData = new FormData();
                    for (key in this.userForm) {
                        formData.append(key, this.userForm[key])
                    }
                    this.handling = true;
                    if (this.method === "create") {
                        axios.post('/api/user/create', formData).then(response => {
                            if (response.data.status === "OK") {
                                this.visible = false
                                this.$message.info(String.format("Create user {0} success", this.userForm.username));
                                this.$refs.userTable.reload();
                            }
                        })
                    } else {
                        const updateUrl = String.format("/api/user/update/{0}", this.currentUser.id);
                        axios.put(updateUrl, formData).then(response => {
                            if (response.data.status === "OK") {
                                this.visible = false
                                this.$message.info(String.format("Update user {0} success", this.currentUser.username));
                                this.$refs.userTable.reload();
                            }
                        })
                    }
                }
            });
        },
        operationClick: function (data) {
            const item = data.item;
            const method = data.content;
            const _that = this;
            switch (method) {
                case "edit":
                    this.userForm = {
                        username: item.name,
                        active: item.active,
                        password: item.password,
                        balance: item.balance,
                        role: item.role
                    }
                    this.currentUser = item;
                    this.method = 'update';
                    this.handling = false;
                    this.visible = true;
                    break;
                case "delete":
                    this.$modal.confirm({
                        title: String.format('Do you confirm delete user {0}', item.name),
                        content: '',
                        onOk: function () {
                            var delete_url = String.format('/api/user/delete/{0}', item.id);
                            axios.delete(delete_url).then(response => {
                                if (response.data.status === "OK") {
                                    _that.$message.info(String.format("Delete user {0} success", item.name));
                                }
                                _that.$refs.userTable.reload();
                            })
                        },
                        onCancel: function () {}
                    })
                    break;
                default:
                    break;
            }
        }
    },
    mounted: function () {
        this.$message.config({
            top: 50
        })
    },
    computed: {
        modalTitle: function () {
            return this.method === "create" ? "Create User" : "Update User"
        },
        confirmText: function () {
            return "Confirm"
        },
        cancelText: function () {
            return "Cancel"
        }
    },
    filters: {
        unixMoment: moment().unix
    }
});
