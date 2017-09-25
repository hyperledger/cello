
<!-- Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
-->
<template>
  <div class="main-content">
    <Row class="page-title">
      <Col span="6">
      <h2 class="sub-title">Users</h2>
      </Col>
      <Col span="18" style="text-align: right">
        <Button type="primary" @click="showUserModal('create')">Create User</Button>
      </Col>
    </Row>
    <Row class="table-row">
      <Table class="custom-table" stripe no-data-text="There is no user" :columns="columns" :data="users"></Table>
      <div style="margin: 10px;overflow: hidden">
        <div style="float: right;">
          <Page :total="userPagination.total" :current="userPagination.current" @on-change="changePage"></Page>
        </div>
      </div>
    </Row>
    <user-modal :type="modalType"
                :onOk="onOk"
                :onCancel="hideUserModal"
                :visible="modalVisible"
                :user="currentUser"
                :formItem="formItem"></user-modal>
    <Modal
      ref="userModal"
      @on-cancel="hideDeleteModal"
      v-model="deleteModalVisible" width="360">
      <p slot="header" style="color:#f60;text-align:center">
        <Icon type="information-circled"></Icon>
        <span>Confirm Delete</span>
      </p>
      <div style="text-align:center">
        <p>Do you want to Delete User <b>{{currentUser.name}}</b> ?</p>
      </div>
      <div slot="footer">
        <Button type="error" size="large" long @click="deleteUser">Delete</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import moment from 'moment'
  import Operation from './Operation'
  import UserModal from './UserModal.vue'
  export default {
    components: {
      'user-modal': UserModal
    },
    data () {
      return {
        columns: [
          {title: 'User Name', key: 'name'},
          {
            title: 'Role',
            key: 'role',
            sortable: true,
            render: (h, params) => {
              const rolesShown = ['Admin', 'Operator', 'User']
              return rolesShown[params.row.role]
            }
          },
          {title: 'Balance', key: 'balance', sortable: true},
          {
            title: 'Create Time',
            key: 'timestamp',
            render: (h, params) => {
              const row = params.row
              const timestamp = row.timestamp
              return moment.unix(timestamp).format('YYYY/MM/DD HH:mm:ss')
            },
            sortable: true
          },
          {
            title: 'Operation',
            key: 'id',
            render: (h, params) => {
              const row = params.row
              return h(Operation, {
                props: {
                  user: row,
                  showUserModal: this.showUserModal,
                  showDeleteModal: this.showDeleteModal
                }
              })
            }
          }
        ],
        deleteModalVisible: false,
        deletingUser: false,
        user: {},
        modalVisible: false,
        modalType: 'create',
        currentUser: {},
        formItem: {
          username: '',
          role: 0,
          balance: 0,
          active: true
        }
      }
    },
    mounted () {
      this.getUsers({})
    },
    computed: {
      ...mapGetters([
        'isLoadingUsers',
        'users',
        'userPagination'
      ])
    },
    methods: {
      ...mapActions([
        'getUsers',
        'deleteSingleUser'
      ]),
      changePage (params) {
        this.getUsers({
          pageNo: params
        })
      },
      showDeleteModal (user) {
        this.currentUser = user
        this.deleteModalVisible = true
      },
      hideDeleteModal () {
        this.deleteModalVisible = false
      },
      deleteUserCallback (params) {
        if (params.success) {
          this.$Message.success('Delete User ' + this.currentUser.name + ' Success')
          this.deleteModalVisible = false
          this.deletingUser = false
        } else {
          this.$Message.success('Delete User ' + this.currentUser.name + ' Fail')
          this.deletingUser = false
        }
      },
      deleteUser () {
        this.deletingUser = true
        this.deleteSingleUser({id: this.currentUser.id, deleteCallback: this.deleteUserCallback})
      },
      showUserModal (modalType, user) {
        this.modalVisible = true
        this.modalType = modalType
        if (user) {
          this.currentUser = user
          this.formItem = {
            username: user.name,
            password: '',
            role: user.role,
            balance: user.balance,
            active: user.active
          }
        } else {
          this.formItem = {
            username: '',
            password: '',
            role: 0,
            balance: 0,
            active: true
          }
        }
      },
      hideUserModal () {
        this.modalVisible = false
      },
      onOk () {
        console.log(this.modalType, this.formItem)
      }
    }
  }
</script>

<style>
  .table-row {
    margin-bottom: 80px;
  }
  .custom-table {
    border-top: 2px solid #57a3f3;
  }
</style>
