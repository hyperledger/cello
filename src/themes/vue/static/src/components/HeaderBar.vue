
<!-- Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
-->
<template>
  <div class="layout-header">
    <Button type="text" @click="toggleClick">
      <Icon type="navicon" size="32"></Icon>
    </Button>
    <Menu style="float: right" mode="horizontal" @on-select="clickMenu">
      <div class="layout-logo"></div>
      <div class="layout-nav">
        <MenuItem name="logout">
          <Icon type="log-out"></Icon>
          Logout
        </MenuItem>
      </div>
    </Menu>
  </div>
</template>

<script>
export default {
  props: ['toggleClick'],
  methods: {
    clickMenu (name) {
      switch (name) {
        case 'logout':
          window.location.href = '/api/auth/logout'
          break
        default:
          break
      }
    }
  }
}
</script>

<style>
.menu-links a {
  display: inline-block;
  text-decoration: none;
  color: #555;
  margin-right: 30px;
}
</style>
