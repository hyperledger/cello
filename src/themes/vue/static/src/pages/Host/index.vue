
<!-- Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
-->
<template>
  <div class="main-content">
    <Row class="page-title">
      <Col span="6">
      <h2 class="sub-title">Hosts</h2>
      </Col>
      <Col span="18" style="text-align: right">
      <Button type="primary" @click="showHostModal('create')">Create Host</Button>
      </Col>
    </Row>
    <Row class="table-row">
      <Table class="custom-table" stripe no-data-text="There is no host" :columns="columns" :data="hosts"></Table>
      <div style="margin: 10px;overflow: hidden">
        <div style="float: right;">
          <Page :total="hostPagination.total" :current="hostPagination.current" @on-change="changePage"></Page>
        </div>
      </div>
    </Row>
    <host-modal :type="modalType"
                :onCancel="hideHostModal"
                :visible="modalVisible"
                :host="currentHost"
                :formItem="formItem"></host-modal>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import Operation from './Operation.vue'
  import HostModal from './HostModal.vue'
  export default {
    components: {
      'host-modal': HostModal
    },
    mounted () {
      this.getHosts()
    },
    data () {
      return {
        modalType: 'create',
        modalVisible: false,
        currentHost: {},
        formItem: {
          name: '',
          worker_api: '',
          capacity: 1,
          log_level: 'INFO',
          log_type: 'local',
          log_server: '',
          schedulable: false,
          autofill: false
        },
        columns: [
          {title: 'Name', key: 'name'},
          {
            title: 'Status',
            key: 'status',
            width: 140,
            render: (h, params) => {
              const row = params.row
              const loadingText = ['operating']
              let color = 'green'
              if (loadingText.indexOf(row.status) >= 0) {
                color = 'blue'
              } else if (row.status !== 'active') {
                color = 'yellow'
              }

              return h('Tag', {
                props: {
                  type: 'dot',
                  color: color
                },
                'class': {
                  status_badge: true
                }
              }, row.status)
            }
          },
          {title: 'Capacity', key: 'capacity'},
          {
            title: 'Chains',
            key: 'clusters',
            render: (h, params) => {
              const row = params.row
              return row.clusters.length
            }
          },
          {title: 'Create Time', key: 'create_ts', width: 200},
          {title: 'Log Level', key: 'log_level'},
          {title: 'Type', key: 'type'},
          {title: 'Log Type', key: 'log_type'},
          {
            title: 'Operations',
            key: 'operation',
            render: (h, params) => {
              const row = params.row
              return h(Operation, {
                props: {
                  host: row,
                  showHostModal: this.showHostModal,
                  onOperateHost: this.onOperateHost,
                  onDeleteHost: this.onDeleteHost
                }
              })
            },
            width: 120
          }
        ]
      }
    },
    computed: {
      ...mapGetters([
        'isLoadingHosts',
        'hosts',
        'hostPagination'
      ])
    },
    methods: {
      ...mapActions([
        'getHosts',
        'operateHost',
        'deleteHost'
      ]),
      changePage (params) {
        console.log(params)
      },
      onDeleteHost (params) {
        this.deleteHost(params)
      },
      showHostModal (type, host) {
        if (host) {
          this.currentHost = host
          this.formItem = {
            name: host.name,
            worker_api: host.worker_api.split('//')[1],
            capacity: host.capacity,
            log_level: host.log_level,
            log_type: host.log_type,
            log_server: host.log_server,
            schedulable: host.schedulable === 'true',
            autofill: host.autofill === 'true'
          }
        } else {
          this.formItem = {
            name: '',
            worker_api: '',
            capacity: 1,
            log_level: 'INFO',
            log_type: 'local',
            log_server: '',
            schedulable: false,
            autofill: false
          }
        }
        this.modalVisible = true
        this.modalType = type
      },
      hideHostModal () {
        this.modalVisible = false
      },
      onOperateHost (item, operation) {
        this.operateHost({
          id: item.id,
          action: operation
        })
      }
    }
  }
</script>

<style>
  .status_badge {
    border-width: 0 !important;
  }
</style>
