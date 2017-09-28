
<!-- Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
-->
<template>
  <div class="main-content">
    <Row class="page-title">
      <Col span="6">
      <h2 class="sub-title">Chains</h2>
      </Col>
      <Col span="18" style="text-align: right">
      <Button type="primary" @click="showModal()">Add Chain</Button>
      </Col>
    </Row>
    <Row class="table-row">
      <Table :loading="isLoadingClusters" class="custom-table" stripe no-data-text="There is no cluster" :columns="columns" :data="clusters"></Table>
      <div style="margin: 10px;overflow: hidden">
        <div style="float: right;">
          <Page :total="clusterPagination.total" :current="clusterPagination.current" @on-change="changePage"></Page>
        </div>
      </div>
    </Row>
    <chain-modal :onCancel="hideClusterModal"
                 :hosts="hostOptions"
                 :visible="clusterModalVisible"
                 :onSubmit="submitForm"
                 :submitting="creatingCluster"
                 :formItem="formItem"></chain-modal>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import ExpandRow from './ExpandRow.vue'
  import ChainModal from './ChainModal.vue'
  import Operation from './Operation.vue'
  export default {
    mounted () {
      this.getClusters()
    },
    components: {
      'chain-modal': ChainModal
    },
    data () {
      return {
        columns: [
          {
            type: 'expand',
            width: 50,
            render: (h, params) => {
              const row = params.row
              const hostId = row.host_id

              return h(ExpandRow, {
                props: {
                  chain: params.row,
                  host: this.hostDict[hostId] ? this.hostDict[hostId] : {}
                }
              })
            }
          },
          {title: 'Name', key: 'name'},
          {title: 'Type', key: 'consensus_plugin'},
          {
            title: 'Status',
            key: 'status',
            render: (h, params) => {
              const row = params.row
              const activeText = ['running']
              const errorText = ['stopped']
              let color = 'green'
              if (activeText.indexOf(row.status) >= 0) {
                color = 'green'
              } else if (errorText.indexOf(row.status) >= 0) {
                color = 'red'
              } else {
                color = 'blue'
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
            },
            width: 200
          },
          {title: 'Size', key: 'size'},
          {title: 'Health', key: 'health'},
          {
            title: 'Host',
            key: 'host_id',
            render: (h, params) => {
              const row = params.row
              const hostId = row.host_id

              return this.hostDict[hostId] ? this.hostDict[hostId].name : ''
            }
          },
          {
            title: 'Operations',
            key: 'operation',
            render: (h, params) => {
              const row = params.row
              return h(Operation, {
                props: {
                  cluster: row,
                  onDelete: this.onDeleteCluster,
                  onOperateCluster: this.onOperateCluster
                }
              })
            },
            width: 120
          }
        ],
        formItem: {
          name: '',
          host_id: '',
          size: 4,
          consensus_plugin: 'solo',
          consensus_mode: 'batch',
          network_type: 'fabric-1.0'
        }
      }
    },
    computed: {
      ...mapGetters([
        'isLoadingClusters',
        'clusters',
        'hostDict',
        'clusterPagination',
        'hostOptions',
        'clusterModalVisible',
        'creatingCluster'
      ])
    },
    methods: {
      ...mapActions([
        'getClusters',
        'showClusterModal',
        'hideClusterModal',
        'createCluster',
        'deleteCluster',
        'operateCluster'
      ]),
      showModal () {
        this.formItem = {
          name: '',
          host_id: '',
          size: 4,
          consensus_plugin: 'solo',
          consensus_mode: 'batch',
          network_type: 'fabric-1.0'
        }
        this.showClusterModal()
      },
      onDeleteCluster (params) {
        this.deleteCluster(params)
      },
      submitForm () {
        this.createCluster(this.formItem)
      },
      onOperateCluster (cluster, action) {
        this.operateCluster({
          action,
          cluster_id: cluster.id,
          name: cluster.name
        })
      }
    }
  }
</script>

<style>
  .status_badge {
    border-width: 0 !important;
    text-transform: capitalize;
    background: transparent !important;
  }
</style>
