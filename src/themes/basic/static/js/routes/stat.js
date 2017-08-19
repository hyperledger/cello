/** Copyright IBM Corp, All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

Vue.component('chart', VueECharts)
function getCluster() {
    return axios.get('/api/stat', {params: {res: 'cluster'}});
}

function getHost() {
    return axios.get('/api/stat', {params: {res: 'host'}});
}
Vue.component('echart', {
    props: ['chartid', 'title', 'data'],
    template: '<chart :options="options"></chart>',
    computed: {
        options: function () {
            var names = []
            var chartData = []
            if (this.data) {
                this.data.map((currentObject, i) => {
                    names.push(currentObject.name)
                    chartData.push({
                        name: currentObject.name,
                        value: currentObject.y
                    })
                })
            }
            var options = {
                title : {
                    text: this.title,
                    x:'center',
                    y: 'bottom'
                },
                tooltip : {
                    trigger: 'item',
                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                },
                legend: {
                    orient: 'vertical',
                    left: 'left',
                    data: names
                },
                series : [
                    {
                        name: this.title,
                        type: 'pie',
                        radius : '55%',
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
            return options;
        }
    }
})
const stats = new Vue({
    el: '#charts',
    data: () => ({
        loading: false,
        host: {},
        cluster: {}
    }),
    methods: {
        onReady(instance) {
            console.log(instance);
        },
        onClick(event, instance, echarts) {
            console.log(arguments);
        }
    },
    mounted: function () {
        const that = this;
        this.loading = true;
        axios.all([getCluster(), getHost()])
            .then(axios.spread(function (cluster, host) {
                that.host = host.data;
                that.cluster = cluster.data;
                that.loading = false;
            }));
    }
});
