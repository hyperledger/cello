
<!-- Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
-->
<template>
  <div class="layout" :class="{'layout-hide-text': spanLeft < 5}">
        <Row type="flex" class="page-body">
            <Col :span="spanLeft" class="layout-menu-left">
              <left-nav :size="iconSize"></left-nav>
            </Col>
            <Col :span="spanRight">
                <header-bar :toggleClick="toggleClick"></header-bar>
                <div class="layout-content">
                    <div class="layout-content-main">
                      <router-view></router-view>
                    </div>
                </div>
                <div class="layout-copy">
                  2017 &copy; Cello
                </div>
            </Col>
        </Row>
    </div>
</template>

<script>
import LeftNav from '@/components/LeftNav'
import HeaderBar from '@/components/HeaderBar'
export default {
  components: {
    LeftNav,
    HeaderBar
  },
  name: 'app',
  data () {
    return {
      spanLeft: 5,
      spanRight: 19
    }
  },
  computed: {
    iconSize () {
      return this.spanLeft === 5 ? 14 : 24
    }
  },
  methods: {
    toggleClick () {
      if (this.spanLeft === 5) {
        this.spanLeft = 2
        this.spanRight = 22
      } else {
        this.spanLeft = 5
        this.spanRight = 19
      }
    }
  }
}
</script>

<style>
    .layout{
        border: 1px solid #d7dde4;
        background: #f5f7f9;
        position: relative;
        border-radius: 4px;
        overflow: hidden;
    }
    .page-body {
      min-height: 100vh;
    }
    .layout-breadcrumb{
        padding: 10px 15px 0;
    }
    .layout-content{
        min-height: 200px;
        margin: 15px;
        overflow: hidden;
        background: #fff;
        border-radius: 4px;
    }
    .layout-content-main{
        padding: 10px 20px;
    }
    .layout-copy{
        text-align: center;
        padding: 10px 0 20px;
        color: #9ea7b4;
    }
    .layout-menu-left{
        background: #464c5b;
    }
    .layout-header{
        height: 60px;
        background: #fff;
        box-shadow: 0 1px 1px rgba(0,0,0,.1);
    }
    .layout-logo-left{
        width: 90%;
        height: 30px;
        background: #5b6270;
        border-radius: 3px;
        margin: 15px auto;
    }
    .layout-ceiling-main a{
        color: #9ba7b5;
    }
    .layout-hide-text .layout-text{
        display: none;
    }
    .ivu-col{
        transition: width .2s ease-in-out;
    }
    .layout-ceiling-main{
      float: right;
      margin-right: 15px;
    }
    .layout-ceiling-main a{
      color: #9ba7b5;
    }
    .page-title {
      padding-top: 15px;
      padding-left: 15px;
      margin-bottom: 20px;
    }
    .sub-title {
      position: relative;
      z-index: 1;
      padding-bottom: 10px;
      display:inline-block;
      border-bottom: 2px solid #5b6270;
    }
    .main-content {
      min-height: 100vh;
    }
</style>
