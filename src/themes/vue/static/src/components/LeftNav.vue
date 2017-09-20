
<!-- Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
-->
<template>
  <Menu :active-name="routerName" @on-select="clickMenu" theme="dark" width="auto">
    <div class="layout-logo-left">
      <span class="layout-text">
        Cello
      </span>
    </div>
    <div v-for="menu in menus">
      <MenuItem :name="menu.key">
        <Icon :size="size" :type="menu.icon" />
        <span class="layout-text">
          {{ menu.name }}
        </span>
      </MenuItem>
    </div>
  </Menu>
</template>

<script>
  import Menus from '@/config/Menus'
  export default {
    props: ['size'],
    data () {
      return {
        menus: Menus
      }
    },
    computed: {
      routerName () {
        return this.$route.name
      }
    },
    methods: {
      clickMenu (name) {
        this.$router.push({name})
      }
    }
  }
</script>

<style>
  .layout-logo-left{
    width: 90%;
    height: 40px;
    background: #5b6270;
    border-radius: 3px;
    margin: 15px auto;
    text-align: center;
    font-family: "Anonymous Pro", "Menlo", "Consolas", "Bitstream Vera Sans Mono", "Courier New", monospace;
    font-size: 24px;
    color: white;
  }
</style>
