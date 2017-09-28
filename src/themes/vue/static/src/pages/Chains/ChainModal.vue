
<!-- Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
-->
<template>
  <Modal
    v-model="visible"
    title="Create a cluster"
    ok-text="OK"
    cancel-text="Cancel">
    <Form ref="clusterForm" :model="formItem" :rules="ruleValidate" :label-width="80">
      <FormItem label="Name" prop="name" :label-width="100">
        <Input type="text" v-model="formItem.name" placeholder="Input chain name" />
      </FormItem>
      <FormItem label="Host" prop="host_id" :label-width="100">
        <Select v-model="formItem.host_id" placeholder="Select a host">
          <Option v-for="host in hosts" :value="host.id">{{host.name}}</Option>
        </Select>
      </FormItem>
      <FormItem label="Network Type" :label-width="100">
        <Select v-model="formItem.network_type">
          <Option value="fabric-1.0">fabric-1.0</Option>
        </Select>
      </FormItem>
      <FormItem label="Chain Size" :label-width="100">
        <Select v-model="formItem.size">
          <Option :value="4">4</Option>
        </Select>
      </FormItem>
      <FormItem label="Consensus Plugin" :label-width="100">
        <Select v-model="formItem.consensus_plugin" placeholder="Select consensus plugin">
          <Option value="solo">SOLO</Option>
          <Option value="kafka">KAFKA</Option>
        </Select>
      </FormItem>
      <FormItem v-if="formItem.consensus_plugin === 'kafka'" label="Consensus Mode" :label-width="100">
        <Select v-model="formItem.consensus_mode" placeholder="Select consensus mode">
          <Option value="batch">BATCH</Option>
        </Select>
      </FormItem>
    </Form>
    <div slot="footer">
      <Button type="text" @click="onCancel">Cancel</Button>
      <Button type="primary" :loading="submitting" @click="submitForm">Ok</Button>
    </div>
    </Modal>
</template>

<script>
  export default {
    props: ['visible', 'onCancel', 'submitting', 'formItem', 'onOk', 'hosts', 'onSubmit'],
    data () {
      return {
        ruleValidate: {
          name: [
            { required: true, message: 'Please input Cluster name', trigger: 'blur' }
          ],
          host_id: [
            { required: true, message: 'Please Select a host', trigger: 'blur' }
          ]
        }
      }
    },
    methods: {
      submitForm () {
        this.$refs['clusterForm'].validate((valid) => {
          if (valid) {
            this.onSubmit()
          }
        })
      }
    }
  }
</script>

<style>
</style>
