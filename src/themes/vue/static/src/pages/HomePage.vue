
<!-- Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
-->
<template>
  <div>
    <Row class="page-title">
      <h2 class="sub-title">Overview</h2>
    </Row>
    <Row :gutter="8" style="padding-bottom: 30px">
      <Spin size="large" fix v-if="isLoadingStats"></Spin>
      <Col span="6">
        <e-chart title="Host Status" :data="hostStatus" chartid="hostStatus"></e-chart>
      </Col>
      <Col span="6">
        <e-chart title="Host Type" :data="hostType" chartid="hostType"></e-chart>
      </Col>
      <Col span="6">
        <e-chart title="Cluster Status" :data="clusterStatus" chartid="clusterStatus"></e-chart>
      </Col>
      <Col span="6">
        <e-chart title="Cluster Type" :data="clusterType" chartid="clusterType"></e-chart>
      </Col>
    </Row>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import Vue from 'vue'
  import EChart from '@/components/EChart'
  Vue.component('e-chart', EChart)
  export default {
    mounted () {
      this.getStats()
    },
    computed: {
      ...mapGetters([
        'isLoadingStats',
        'hostStatus',
        'hostType',
        'clusterStatus',
        'clusterType'
      ])
    },
    methods: {
      ...mapActions([
        'getStats'
      ])
    }
  }
</script>
<style>
  .echarts {
    width: 100% !important;
    height: 300px !important;
  }
</style>
