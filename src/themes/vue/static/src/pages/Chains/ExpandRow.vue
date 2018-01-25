
<!-- Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
-->
<template>
  <div>
    <Row class="expand-row">
      <Col span="8">
      <span class="expand-key">Create Time: </span>
      <span class="expand-value">{{ chain.create_ts }}</span>
      </Col>
      <Col span="8">
      <span class="expand-key">Network Type: </span>
      <span class="expand-value">{{ chain.network_type }}</span>
      </Col>
      <Col span="8">
      <span class="expand-key">Consensus Mode: </span>
      <span class="expand-value">{{ chain.consensus_mode }}</span>
      </Col>
    </Row>
    <Row class="expand-row">
      <Col span="8">
      <span class="expand-key">Host Type: </span>
      <span class="expand-value">{{ host.type }}</span>
      </Col>
      <Col span="8">
      <span class="expand-key">Host Capacity: </span>
      <span class="expand-value">{{ host.capacity }}</span>
      </Col>
      <Col span="8">
      <span class="expand-key">Explorer URL: </span>
      <a class="expand-value" v-for="(item, index) in chain.service_url" v-if="index === 'dashboard'" :href="'http://'+item ">http://{{ item }}</a>
      </Col>
    </Row>
  </div>
</template>

<script>
  export default {
    props: ['chain', 'host']
  }
</script>

<style scoped>
  .expand-row {
    margin-bottom: 16px;
  }
  .expand-key {
    font-weight: bold;
  }
</style>
