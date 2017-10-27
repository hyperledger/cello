
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/15.
 */
define([
    "jquery",
    "echarts",
    "app/kit/ui",
    "app/kit/overlayer",
    "app/kit/common",
    "app/dashboard/profile",
    "plugin/text!resources/dashboard/analytics/infrastructure.html",
    "app/kit/array",
    "uikit",
    "lodash"
], function($, echarts, UI, Overlayer, Common, Profile, Infrastructure) {
    $(function() {
        new Profile();

        var ui = new UI();
        var common = new Common();
        var $chain = $("#chainSelector button label");
        var $chainList = $("#chainSelector ul");
        var $analyticsPanel;
        var $healthLabel;
        var $cpuUsageLabel;
        var $memoryUsageLabel;
        var $latencyLabel;
        var $canvas;
        var interval = 5000;
        var timer;
        var sampling = 10;
        //图表数据集
        var dataSet = [
            {
                xAxisData: [],
                yAxisLabel: "CPU(%)",
                series: {
                    "Percentage": []
                }
            },
            {
                xAxisData: [],
                yAxisLabel: "Memory",
                series: {
                    "Usage": [],
                    "Limit": []
                },
                originData: [] //原始数据，用来计算单位
            },
            {
                xAxisData: [],
                yAxisLabel: "Block",
                series: {
                    "Read": [],
                    "Write": []
                },
                originData: [] //原始数据，用来计算单位
            },
            {
                xAxisData: [],
                yAxisLabel: "Network",
                series: {
                    "RX": [],
                    "TX": []
                },
                originData: [] //原始数据，用来计算单位
            }
        ];
        //最新的时间戳
        var latest_ts;

        function infrastructure() {
            $analyticsPanel = $("#analyticsPanel");
            //所有坐标系的位置和大小
            var grids = [
                {left: "7%", top: "7%", width: "38%", height: "35%"},
                {left: "55%", top: "7%", width: "38%", height: "35%"},
                {left: "7%", top: "58%", width: "38%", height: "35%"},
                {left: "55%", top: "58%", width: "38%", height: "35%"}
            ];
            //所有坐标系对应的legend名称
            var legends = [
                { data: ["Percentage"] },
                { data: ["Usage", "Limit"] },
                { data: ["Read", "Write"] },
                { data: ["RX", "TX"] }
            ];
            //所有坐标系的x,y轴
            var xAxis = [], yAxis = [];
            //所有坐标系的线图
            var series = [];
            /**
             * 根据legend的颜色，创建tooltip中每个legend对应的小图标
             */
            function symbol(color) {
                return "<span style='display:inline-block;margin-right:5px;" +
                    "border-radius:10px;width:9px;height:9px;" +
                    "background-color:" + color + "'></span>";
            }
            //初始化所有坐标系的标题，图例，x,y轴和线图
            echarts.util.each(grids, function(grid, idx) {
                legends[idx].right = 100 - (parseFloat(grid.left) + parseFloat(grid.width)) + "%";
                legends[idx].top = parseFloat(grid.top) - 6 + "%";

                xAxis.push({
                    gridIndex: idx,
                    type: "category",
                    name: "Time",
                    nameGap: 5,
                    nameTextStyle: { fontSize: 10 },
                    axisLabel: { textStyle: { fontSize: 10 } },
                    data: dataSet[idx]["xAxisData"]
                });
                yAxis.push({
                    gridIndex: idx,
                    type: "value",
                    name: dataSet[idx]["yAxisLabel"],
                    nameGap: 10,
                    nameTextStyle: { fontSize: 10 },
                    axisLabel: { textStyle: { fontSize: 10 } }
                });
                var legend = legends[idx].data;
                for (var i=0; i<legend.length; i++) {
                    series.push({
                        name: legend[i],
                        type: "line",
                        xAxisIndex: idx,
                        yAxisIndex: idx,
                        smooth: true,
                        showSymbol: false,
                        data: dataSet[idx]["series"][legend[i]]
                    });
                }
            });
            //设置charts的所有option
            this.option = {
                tooltip: {
                    trigger: "axis",
                    formatter: function(params) {
                        var N = params.length;
                        if (N) {
                            var tip = params[0].name + "<br/>";
                            for (var i=0; i<N; i++) {
                                tip += symbol(params[i].color) +
                                    params[i].seriesName + " : " +
                                    (params[i].data ? params[i].data.label : "N/A");
                                if (i < N - 1) tip += "<br/>";
                            }
                            return tip;
                        }
                    }
                },
                legend: legends,
                grid: grids,
                xAxis: xAxis,
                yAxis: yAxis,
                series: series
            };
        }
        infrastructure.prototype = {
            load: function(id) {
                var _self = this;
                var overlayer = new Overlayer();
                overlayer.show();
                //清空当前数据集
                _self.emptyDataSet();
                $.ajax({
                    type: "GET",
                    url: "/api/chain/" + id + "/analytics/infrastructure",
                    data: {
                        size: 10
                    },
                    dataType: "json",
                    success: function(data) {
                        overlayer.hide();
                        $analyticsPanel.empty();
                        if (data.success) {
                            var statistic = data.statistics;
                            var cpuUsage, memoryUsage, latency;
                            if (statistic.length) {
                                cpuUsage = parseFloat(statistic[0]["cpu_percentage"].toFixed(2));
                                memoryUsage = parseFloat(statistic[0]["memory_percentage"].toFixed(2));
                                latency = parseFloat(statistic[0]["avg_latency"].toFixed(2));
                                latest_ts = statistic[0]["timestamp"];
                            }
                            //加载overview视图
                            var infrastructureInfo = _.template(Infrastructure);
                            $analyticsPanel.append(infrastructureInfo({
                                health: data.health,
                                cpu: cpuUsage,
                                memory: memoryUsage,
                                latency: latency
                            }));
                            $healthLabel = $analyticsPanel.find(".health");
                            $cpuUsageLabel = $analyticsPanel.find(".cpu");
                            $memoryUsageLabel = $analyticsPanel.find(".memory");
                            $latencyLabel = $analyticsPanel.find(".latency");
                            $canvas = $analyticsPanel.find(".canvas");
                            //加载图表数据
                            _self.chart = echarts.init($canvas[0]);
                            _self.writeData(statistic.reverse());
                            _self.refreshChart();
                            //定时刷新图表
                            timer = setTimeout(function() { _self.refresh(id); }, interval);
                        } else {
                            ui.dialog.error(data.message);
                        }
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        overlayer.hide();
                        $analyticsPanel.empty();
                        ui.dialog.error(errorThrown);
                    }
                });
            },
            refresh: function(id) {
                var _self = this;
                clearTimeout(timer);
                $.ajax({
                    type: "GET",
                    url: "/api/chain/" + id + "/analytics/infrastructure",
                    dataType: "json",
                    success: function(data) {
                        if (data.success) {
                            var statistics = data.statistics;
                            if (statistics.length && statistics[0]["timestamp"] != latest_ts) {
                                //图表刷新
                                _self.writeData(statistics);
                                _self.refreshChart();
                                //overview视图刷新
                                var health = data.health;
                                health = health >= 90 ? "Perfect" : (health >= 80 ? "Good" : "Attention");
                                var cpuUsage = parseFloat(statistics[0]["cpu_percentage"].toFixed(2));
                                var memoryUsage = parseFloat(statistics[0]["memory_percentage"].toFixed(2));
                                var latency = parseFloat(statistics[0]["avg_latency"].toFixed(2));
                                _self.refreshOverviewLabel($healthLabel, health);
                                _self.refreshOverviewLabel($cpuUsageLabel, cpuUsage);
                                _self.refreshOverviewLabel($memoryUsageLabel, memoryUsage);
                                _self.refreshOverviewLabel($latencyLabel, latency);

                                latest_ts = statistics[0]["timestamp"];
                            }
                            timer = setTimeout(function() { _self.refresh(id); }, interval);
                        } else {
                            ui.dialog.error(data.message);
                        }
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        ui.dialog.error(errorThrown);
                    }
                });
            },
            stopRefresh: function() {
                clearTimeout(timer);
            },
            emptyDataSet: function() {
                for (var i=0; i<dataSet.length; i++) {
                    dataSet[i]["xAxisData"] = [];
                    for (var item in dataSet[i]["series"]) {
                        dataSet[i]["series"][item] = [];
                    }
                    if (dataSet[i]["originData"]) {
                        dataSet[i]["originData"] = [];
                    }
                }
            },
            writeData: function(statistics) {
                //计算Memory，Block和Network的数值单位
                for (var i=0; i<statistics.length; i++) {
                    var statistic = statistics[i];
                    //Memory
                    dataSet[1]["originData"].extrude(sampling * 2, [statistic.memory_usage, statistic.memory_limit]);
                    //Block
                    dataSet[2]["originData"].extrude(sampling * 2, [statistic.block_read, statistic.block_write]);
                    //Network
                    dataSet[3]["originData"].extrude(sampling * 2, [statistic.network_rx, statistic.network_tx]);
                }
                //Memory的当前数值单位
                var memoryUnit = common.getBytesUnit(dataSet[1]["originData"]);
                //Block的当前数值单位
                var blockUnit = common.getBytesUnit(dataSet[2]["originData"]);
                //Network的当前数值单位
                var networkUnit = common.getBytesUnit(dataSet[3]["originData"]);
                //设置y轴的数值单位
                dataSet[1]["yAxisLabel"] = "Memory(" + memoryUnit + ")";
                dataSet[2]["yAxisLabel"] = "Block(" + blockUnit + ")";
                dataSet[3]["yAxisLabel"] = "Network(" + networkUnit + ")";
                //设置x轴的数值
                for (var i=0; i<statistics.length; i++) {
                    var statistic = statistics[i];
                    //CPU
                    var percentage = parseFloat(statistic.cpu_percentage.toFixed(2));
                    dataSet[0]["xAxisData"].extrude(sampling, statistic.timestamp);
                    dataSet[0]["series"]["Percentage"].extrude(sampling, {
                        value: percentage,
                        label: percentage + "%"
                    });
                    //Memory
                    dataSet[1]["xAxisData"].extrude(sampling, statistic.timestamp);
                    dataSet[1]["series"]["Usage"].extrude(sampling, {
                        value: common.scaleBytes(statistic.memory_usage, memoryUnit),
                        label: common.parseBytes(statistic.memory_usage)
                    });
                    dataSet[1]["series"]["Limit"].extrude(sampling, {
                        value: common.scaleBytes(statistic.memory_limit, memoryUnit),
                        label: common.parseBytes(statistic.memory_limit)
                    });
                    //Block
                    dataSet[2]["xAxisData"].extrude(sampling, statistic.timestamp);
                    dataSet[2]["series"]["Read"].extrude(sampling, {
                        value: common.scaleBytes(statistic.block_read, blockUnit),
                        label: common.parseBytes(statistic.block_read)
                    });
                    dataSet[2]["series"]["Write"].extrude(sampling, {
                        value: common.scaleBytes(statistic.block_write, blockUnit),
                        label: common.parseBytes(statistic.block_write)
                    });
                    //Network
                    dataSet[3]["xAxisData"].extrude(sampling, statistic.timestamp);
                    dataSet[3]["series"]["RX"].extrude(sampling, {
                        value: common.scaleBytes(statistic.network_rx, networkUnit),
                        label: common.parseBytes(statistic.network_rx)
                    });
                    dataSet[3]["series"]["TX"].extrude(sampling, {
                        value: common.scaleBytes(statistic.network_tx, networkUnit),
                        label: common.parseBytes(statistic.network_tx)
                    });
                }
            },
            refreshChart: function() {
                for (var i=0; i<this.option.xAxis.length; i++) {
                    this.option.xAxis[i].data = dataSet[i]["xAxisData"];
                }
                for (var i=0; i<this.option.yAxis.length; i++) {
                    this.option.yAxis[i].name = dataSet[i]["yAxisLabel"];
                }
                for (var i=0; i<this.option.series.length; i++) {
                    var idx = this.option.series[i].xAxisIndex;
                    this.option.series[i].data = dataSet[idx]["series"][this.option.series[i].name];
                }
                this.chart.setOption(this.option);
            },
            refreshOverviewLabel: function($label, newValue) {
                if ($label.text() != newValue) {
                    $label.animate({
                        opacity: 0,
                        marginTop: 100
                    }, "slow", function() {
                        $(this).text(newValue).css("marginTop", -100).animate({
                            opacity: 1,
                            marginTop: 0
                        }, "slow");
                    });
                }
            }
        };
        var infra = new infrastructure();
        infra.load($chain.data("id"));
        $chainList.find("li").on("click", function() {
            infra.stopRefresh();
            $(this).parents(".uk-dropdown").hide();
            $chain.data("id", $(this).data("id")).html($(this).data("name"));
            infra.load($(this).data("id"));
        });
    });
});