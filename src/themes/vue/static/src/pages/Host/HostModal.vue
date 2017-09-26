
<!-- Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
-->
<template>
  <Modal
    v-model="visible"
    :title="title"
    ok-text="OK"
    cancel-text="Cancel">
    <Form ref="hostForm" :model="formItem" :rules="ruleValidate" :label-width="80">
      <FormItem label="Host Name" prop="name" :label-width="100">
        <Input type="text" :readonly="type === 'update'" v-model="formItem.name" placeholder="Input host name" />
      </FormItem>
      <FormItem prop="worker_api" :label-width="100">
        <label slot="label">
          URL
          <Tooltip placement="top-end">
            <Icon type="help-circled" />
            <div slot="content">
              <p>Input the node ip and port</p>
              <p>example: 192.168.1.1:6527</p>
            </div>
          </Tooltip>
        </label>
        <Input :readonly="type === 'update'" v-model="formItem.worker_api">
          <span slot="prepend">tcp://</span>
        </Input>
      </FormItem>
      <FormItem label="Capacity" :label-width="100">
        <InputNumber :min="1" v-model="formItem.capacity"></InputNumber>
      </FormItem>
      <FormItem label="Log Level" prop="log_level" :label-width="100">
        <Select v-model="formItem.log_level" placeholder="Select log level">
          <Option value="DEBUG">DEBUG</Option>
          <Option value="INFO">INFO</Option>
          <Option value="NOTICE">NOTICE</Option>
          <Option value="WARNING">WARNING</Option>
          <Option value="ERROR">ERROR</Option>
          <Option value="CRITICAL">CRITICAL</Option>
        </Select>
      </FormItem>
      <FormItem label="Log Type" prop="log_type" :label-width="100">
        <Select v-model="formItem.log_type" placeholder="Select log type">
          <Option value="local">LOCAL</Option>
          <Option value="syslog">SYSLOG</Option>
        </Select>
      </FormItem>
      <FormItem v-if="formItem.log_type === 'syslog'" label="Log Server" :label-width="100">
        <Input v-model="formItem.log_server" />
      </FormItem>
      <FormItem :label-width="100">
        <label slot="label">
          Schedulable
          <Tooltip placement="top-end">
            <Icon type="help-circled" />
            <div slot="content">
              Schedulable for cluster request
            </div>
          </Tooltip>
        </label>
        <i-switch v-model="formItem.schedulable" size="large">
          <span v-for="item in switchChoices" :slot="item.value">{{ item.label }}</span>
        </i-switch>
      </FormItem>
      <FormItem :label-width="100">
        <label slot="label">
          Keep filed
          <Tooltip placement="top-end">
            <Icon type="help-circled" />
            <div slot="content">
              Keep filled with cluster
            </div>
          </Tooltip>
        </label>
        <i-switch v-model="formItem.autofill" size="large">
          <span v-for="item in switchChoices" :slot="item.value">{{ item.label }}</span>
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
  import { mapActions } from 'vuex'
  export default {
    props: ['type', 'visible', 'onCancel', 'formItem', 'onOk', 'host'],
    data () {
      const validateName = (rule, value, callback) => {
        callback()
      }
      return {
        ruleValidate: {
          name: [
            { required: true, message: 'Please input Host name', trigger: 'blur' },
            { validator: validateName, trigger: 'blur' }
          ],
          worker_api: [
            { required: true, message: 'Please input URL', trigger: 'blur' }
          ],
          log_level: [
            { required: true, message: 'Please Select a log level', trigger: 'blur' }
          ],
          log_type: [
            { required: true, message: 'Please Select a log type', trigger: 'blur' }
          ]
        },
        switchChoices: [
          {
            value: true,
            label: 'Yes'
          },
          {
            value: false,
            label: 'No'
          }
        ]
      }
    },
    computed: {
      title () {
        if (this.type === 'create') {
          return 'Create Host'
        } else {
          return 'Edit Host'
        }
      }
    },
    methods: {
      ...mapActions([
        'updateHost',
        'createHost'
      ]),
      hideModal () {
        this.$refs['hostForm'].resetFields()
        this.onCancel()
      },
      submitForm () {
        this.$refs['hostForm'].validate((valid) => {
          this.submitting = true
          if (valid) {
            this.formItem.schedulable = this.formItem.schedulable ? 'true' : 'false'
            this.formItem.autofill = this.formItem.autofill ? 'true' : 'false'
            if (this.type === 'create') {
              this.createHost(this.formItem)
              this.submitting = false
              this.onCancel()
            } else if (this.type === 'update') {
              this.formItem.id = this.host.id
              this.updateHost(this.formItem)
              this.submitting = false
              this.onCancel()
            }
          } else {
            this.submitting = false
          }
        })
      }
    }
  }
</script>

<style>
</style>
