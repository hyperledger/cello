
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
      <DropdownItem name="edit">Edit</DropdownItem>
      <DropdownItem name="fillup">Fill Up</DropdownItem>
      <DropdownItem name="clean">Clean</DropdownItem>
      <DropdownItem name="reset">Reset</DropdownItem>
      <DropdownItem divided name="delete">Delete</DropdownItem>
    </DropdownMenu>
  </Dropdown>
</template>

<script>
  export default {
    props: ['host', 'showDeleteModal', 'showHostModal', 'onOperateHost', 'onDeleteHost'],
    methods: {
      clickMenu (name) {
        const _that = this
        switch (name) {
          case 'edit':
            this.showHostModal('update', this.host)
            break
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
                    }, _that.host.name),
                    ' ? This operation is irreversible.'
                  ])
                ])
              },
              okText: 'Ok',
              cancelText: 'Cancel',
              onOk () {
                console.log('delete')
                _that.onDeleteHost({id: _that.host.id})
              }
            })
            break
          case 'reset':
            this.$Modal.confirm({
              title: 'Want to reset?',
              render: (h) => {
                return h('div', {
                  style: {
                    paddingTop: '10px'
                  }
                }, [
                  h('p', {}, [
                    'Do you are want to reset ',
                    h('span', {
                      style: {
                        color: 'red',
                        fontWeight: 'bold'
                      }
                    }, _that.host.name),
                    ' ? This procedure is irreversible.'
                  ])
                ])
              },
              okText: 'Ok',
              cancelText: 'Cancel',
              onOk () {
                _that.onOperateHost(_that.host, name)
              }
            })
            break
          case 'fillup':
          case 'clean':
            this.onOperateHost(this.host, name)
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
