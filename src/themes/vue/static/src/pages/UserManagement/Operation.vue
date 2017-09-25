
<!-- Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
-->
<template>
  <Dropdown @on-click="clickMenu">
    <a href="javascript:void(0)">
      Operations
      <Icon type="arrow-down-b"></Icon>
    </a>
    <DropdownMenu slot="list">
      <DropdownItem :disabled="user.name && user.name === 'admin'" name="edit">Edit</DropdownItem>
      <DropdownItem :disabled="user.name && user.name === 'admin'" divided name="delete">Delete</DropdownItem>
    </DropdownMenu>
  </Dropdown>
</template>

<script>
  export default {
    props: ['user', 'showDeleteModal', 'showUserModal'],
    methods: {
      clickMenu (name) {
        switch (name) {
          case 'edit':
            this.showUserModal('update', this.user)
            break
          case 'delete':
            this.showDeleteModal(this.user)
            break
          default:
            break
        }
      }
    }
  }
</script>

<style>
</style>
