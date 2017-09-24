
<!-- Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
-->
<template>
  <Modal
    v-model="visible"
    :title="title"
    ok-text="OK"
    cancel-text="Cancel">
    <Form ref="userForm" :model="formItem" :rules="ruleValidate" :label-width="80">
      <FormItem label="Name" prop="username">
        <Input type="text" :readonly="type === 'update'" v-model="formItem.username" placeholder="Input username" />
      </FormItem>
      <FormItem label="Password" prop="password">
        <Input type="text" v-model="formItem.password" placeholder="Input password" />
      </FormItem>
      <FormItem label="Role">
        <Select v-model="formItem.role" placeholder="Select a role">
          <Option v-for="item in roles" :value="item.value" :key="item.value">{{ item.label }}</Option>
        </Select>
      </FormItem>
      <FormItem label="Balance">
        <InputNumber :max="9999" :min="0" v-model="formItem.balance"></InputNumber>
      </FormItem>
      <FormItem label="Active">
        <i-switch v-model="formItem.active" size="large">
          <span v-for="item in activeChoices" :slot="item.value">{{ item.label }}</span>
        </i-switch>
      </FormItem>
    </Form>
    <div slot="footer">
      <Button type="text" @click="hideModal">Cancel</Button>
      <Button type="primary" :loading="submitting" @click="submitForm">Ok</Button>
    </div>
    </Modal>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import user from '@/api/user'
  export default {
    props: ['type', 'visible', 'onCancel', 'formItem', 'onOk', 'user'],
    data () {
      const validateName = (rule, value, callback) => {
        if (!value) {
          callback(new Error('Please input username'))
        }
        if (this.type === 'create') {
          user.searchUser({
            username: value
          }, result => {
            if (result.user_exists) {
              callback(new Error('User already exists'))
            } else {
              callback()
            }
          })
        } else {
          callback()
        }
      }
      const validatePassword = (rule, value, callback) => {
        if (this.type === 'create' && !value) {
          callback(new Error('Please input password for new user'))
        } else {
          callback()
        }
      }
      return {
        roles: [
          {
            value: 0,
            label: 'Admin'
          },
          {
            value: 1,
            label: 'Operator'
          },
          {
            value: 2,
            label: 'User'
          }
        ],
        activeChoices: [
          {
            value: true,
            label: 'Yes'
          },
          {
            value: false,
            label: 'No'
          }
        ],
        ruleValidate: {
          username: [
            { validator: validateName, trigger: 'blur' }
          ],
          password: [
            { validator: validatePassword, trigger: 'blur' }
          ]
        },
        submitting: false
      }
    },
    computed: {
      ...mapGetters([
        'currentUser',
        'userModal'
      ]),
      title () {
        if (this.type === 'create') {
          return 'Create User'
        } else {
          return 'Edit User'
        }
      }
    },
    methods: {
      ...mapActions([
        'getUsers'
      ]),
      submitForm () {
        this.$refs['userForm'].validate((valid) => {
          this.submitting = true
          let formData = new FormData()
          if (valid) {
            for (const key in this.formItem) {
              formData.append(key, this.formItem[key])
            }
            if (this.type === 'create') {
              user.createUser(formData, result => {
                if (result.status === 'OK') {
                  this.$Message.success('Create user success')
                  this.hideModal()
                  this.submitting = false
                  this.getUsers({})
                } else {
                  this.$Message.error('Create user failed')
                  this.submitting = false
                }
              })
            } else {
              user.updateUser({
                id: this.user.id,
                formData
              }, result => {
                if (result.status === 'OK') {
                  this.$Message.success('Update user success')
                  this.hideModal()
                  this.submitting = false
                  this.getUsers({})
                } else {
                  this.$Message.error('Update user failed')
                  this.submitting = false
                }
              })
            }
          } else {
            this.submitting = false
          }
        })
      },
      hideModal () {
        this.$refs['userForm'].resetFields()
        this.onCancel()
      }
    }
  }
</script>

<style>
</style>
