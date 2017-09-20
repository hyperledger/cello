
<!-- Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
-->
<template>
  <chart :options="options"></chart>
</template>

<script>
  import Vue from 'vue'
  var ECharts = require('vue-echarts')
  Vue.component('chart', ECharts)
  export default {
    props: ['chartid', 'title', 'data'],
    computed: {
      options: function () {
        let names = []
        let chartData = []
        if (this.data) {
          this.data.map((currentObject, i) => {
            names.push(currentObject.name)
            chartData.push({
              name: currentObject.name,
              value: currentObject.y
            })
          })
        }
        return {
          title: {
            text: this.title,
            x: 'center',
            y: 'bottom'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b} : {c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            left: 'left',
            data: names
          },
          series: [
            {
              name: this.title,
              type: 'pie',
              radius: '55%',
              center: ['50%', '60%'],
              data: chartData,
              itemStyle: {
                emphasis: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }
          ]
        }
      }
    }
  }
</script>
