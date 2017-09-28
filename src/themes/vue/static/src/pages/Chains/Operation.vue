
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
      <DropdownItem :disabled="cluster.status === 'running'" name="start">Start</DropdownItem>
      <DropdownItem :disabled="cluster.status === 'stopped'" name="stop">Stop</DropdownItem>
      <DropdownItem name="restart">Restart</DropdownItem>
      <DropdownItem divided name="delete">Delete</DropdownItem>
    </DropdownMenu>
  </Dropdown>
</template>

<script>
  export default {
    props: ['cluster', 'onOperateCluster', 'onDelete'],
    methods: {
      clickMenu (name) {
        const _that = this
        switch (name) {
          case 'delete':
            this.$Modal.confirm({
              title: 'Confirm to delete',
              render: (h) => {
                return h('div', {
                  style: {
                    paddingTop: '10px'
                  }
                }, [
                  h('p', {}, [
                    'Do you want to delete ',
                    h('span', {
                      style: {
                        color: 'red',
                        fontWeight: 'bold'
                      }
                    }, _that.cluster.name),
                    ' ? This operation is irreversible.'
                  ])
                ])
              },
              okText: 'Ok',
              cancelText: 'Cancel',
              onOk () {
                _that.onDelete({id: _that.cluster.id, col_name: 'active', name: _that.cluster.name})
              }
            })
            break
          case 'start':
          case 'stop':
          case 'restart':
            this.onOperateCluster(this.cluster, name)
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
