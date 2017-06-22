
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
    "plugin/text!resources/dashboard/analytics/fabric/fabric.html",
    "plugin/text!resources/dashboard/analytics/fabric/block.html",
    "app/kit/array",
    "uikit",
    "lodash"
], function($, echarts, UI, Overlayer, Common, Profile, Fabric, Block) {
    $(function() {
        new Profile();

        var ui = new UI();
        var common = new Common();
        var $chain = $("#chainSelector button label");
        var $chainList = $("#chainSelector ul");
        var $analyticsPanel;
        var $healthLabel;
        var $blockNumLabel;
        var $avgBlockTimeLabel;
        var $minBlockTimeLabel;
        var $maxBlockTimeLabel;
        var $blocksContainer;
        var $canvas;
        var interval = 5000;
        var timer;
        var sampling = 15;
        //线图数据集
        var xAxisData = [], series = [];
        var blockTimes = [];
        //最新的时间戳
        var latest_ts;

        function fabric() {
            $analyticsPanel = $("#analyticsPanel");
            /**
             * 根据legend的颜色，创建tooltip中每个legend对应的小图标
             */
            function symbol(color) {
                return "<span style='display:inline-block;margin-right:5px;" +
                    "border-radius:10px;width:9px;height:9px;" +
                    "background-color:" + color + "'></span>";
            }
            this.option = {
                tooltip: {
                    trigger: "axis",
                    formatter: function(params) {
                        var N = params.length;
                        if (N) {
                            var tip = params[0].seriesName + "<br/>";
                            for (var i=0; i<N; i++) {
                                tip += symbol(params[i].color) +
                                    "Block " + params[i].name + ": " +
                                    (params[i].data ? params[i].data.label : "N/A");
                                if (i < N - 1) tip += "<br/>";
                            }
                            return tip;
                        }
                    },
                    axisPointer: {
                        type: "line",
                        lineStyle: {
                            width: 35,
                            opacity: 0.2
                        }
                    }
                },
                legend: {
                    right: 0,
                    data: ["Block Time"]
                },
                grid: {
                    left: "8%",
                    right: "6%",
                    top: "7%",
                    bottom: "7%"
                },
                xAxis: {
                    type: "category",
                    name: "Blocks",
                    nameGap: 5,
                    nameTextStyle: { fontSize: 10 },
                    axisLabel: { textStyle: { fontSize: 10 } },
                    data: xAxisData
                },
                yAxis: {
                    type: "value",
                    name: "Time(s)",
                    nameGap: 10,
                    nameTextStyle: { fontSize: 10 },
                    axisLabel: { textStyle: { fontSize: 10 } }
                },
                series: {
                    name: "Block Time",
                    type: "bar",
                    barWidth: 25,
                    barMinHeight: 5,
                    data: series
                }
            };
        }
        fabric.prototype = {
            load: function(id) {
                var _self = this;
                var overlayer = new Overlayer();
                overlayer.show();
                //清空当前数据集
                xAxisData = [];
                series = [];
                blockTimes = [];
                $.ajax({
                    type: "GET",
                    url: "/api/chain/" + id + "/analytics/fabric",
                    dataType: "json",
                    success: function(data) {
                        overlayer.hide();
                        $analyticsPanel.empty();
                        if (data.success) {
                            var blocks = data.blocks;
                            var blockNum = blocks.length;
                            for (var i=0; i<blockNum; i++) {
                                _self.writeData(blocks[i]);
                            }
                            //加载overview视图
                            var fabricInfo = _.template(Fabric);
                            $analyticsPanel.append(fabricInfo({
                                health: data.health,
                                blockNum: blockNum,
                                avgBlockTime: _self.avg(),
                                minBlockTime: _self.min(),
                                maxBlockTime: _self.max()
                            }));
                            $healthLabel = $analyticsPanel.find(".health");
                            $blockNumLabel = $analyticsPanel.find(".blockNum");
                            $avgBlockTimeLabel = $analyticsPanel.find(".avgBlockTime");
                            $minBlockTimeLabel = $analyticsPanel.find(".minBlockTime");
                            $maxBlockTimeLabel = $analyticsPanel.find(".maxBlockTime");
                            $blocksContainer = $analyticsPanel.find("tbody");
                            $canvas = $analyticsPanel.find(".canvas");
                            //加载表格数据
                            var blockInfo = _.template(Block);
                            for (var i=blockNum-1; i>=0; i--) {
                                $blocksContainer.append(blockInfo({
                                    block: blocks[i]["no"],
                                    blockTime: blocks[i]["parsedTime"],
                                    createTime: blocks[i]["formattedTime"]
                                }));
                            }
                            //加载图表数据
                            _self.chart = echarts.init($canvas[0]);
                            _self.refreshChart();
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
            writeData: function(block) {
                //第0个block的block time是0，第1个block的block time是预存的，所以都不算
                //所以从第2个block开始计算
                if (parseInt(block["no"]) > 1) {
                    xAxisData.extrude(sampling, block["no"]+"");
                    series.extrude(sampling, {
                        value: block["block_time"],
                        label: block["parsedTime"]
                    });
                    blockTimes.push(block["block_time"]);
                }
                latest_ts = block["timestamp"];
            },
            refreshChart: function() {
                this.option.xAxis.data = xAxisData;
                this.option.series.data = series;
                this.chart.setOption(this.option);
            },
            avg: function() {
                var avg = 0;
                for (var i=0; i<blockTimes.length; i++) {
                    avg += blockTimes[i];
                }
                if (blockTimes.length > 0) avg = avg / blockTimes.length;
                return this.parse(avg);
            },
            min: function() {
                var min = blockTimes.length > 0 ? Number.MAX_VALUE : 0;
                for (var i=0; i<blockTimes.length; i++) {
                    if (blockTimes[i] < min) min = blockTimes[i];
                }
                return this.parse(min);
            },
            max: function() {
                var max = blockTimes.length > 0 ? Number.MIN_VALUE : 0;
                for (var i=0; i<blockTimes.length; i++) {
                    if (blockTimes[i] > max) max = blockTimes[i];
                }
                return this.parse(max);
            },
            parse: function(val) {
                var parsedTime = common.parseTime(val).split(" ");
                if (parsedTime.length == 1) {
                    return "<span class=\"font-size-50\">" + parsedTime[0].substr(0, parsedTime[0].length - 1) + "</span>" +
                        "\n<span class=\"font-size-20\">" + parsedTime[0].substr(-1) + "</span>";
                } else {
                    return "<span class=\"font-size-50\">" + parsedTime[0].substr(0, parsedTime[0].length - 1) + "</span>" +
                        "\n<span class=\"uk-margin-right font-size-20\">" + parsedTime[0].substr(-1) + "</span>" +
                        "<span class=\"font-size-50\">" + parsedTime[1].substr(0, parsedTime[1].length - 1) + "</span>" +
                        "\n<span class=\"font-size-20\">" + parsedTime[1].substr(-1) + "</span>";
                }
            },
            refreshOverviewLabel: function($label, newValue) {
                if ($label.html() != newValue) {
                    var top = parseInt($label.css("marginTop"));
                    $label.animate({
                        opacity: 0,
                        marginTop: 100
                    }, "slow", function() {
                        $(this).html(newValue).css("marginTop", -100).animate({
                            opacity: 1,
                            marginTop: top
                        }, "slow");
                    });
                }
            },
            refresh: function(id) {
                var _self = this;
                clearTimeout(timer);
                $.ajax({
                    type: "GET",
                    url: "/api/chain/" + id + "/analytics/fabric",
                    data: {
                        timestamp: latest_ts
                    },
                    dataType: "json",
                    success: function(data) {
                        if (data.success) {
                            var blocks = data.blocks;
                            var blockNum = blocks.length;
                            if (blockNum) {
                                for (var i=0; i<blockNum; i++) {
                                    var block = blocks[i];
                                    //动态加载表格数据
                                    var $tr = $("<tr></tr>").prependTo($blocksContainer);
                                    var $blockTD = $("<td class='td-top-border' style='width:28%;'></td>").appendTo($tr);
                                    var $blockTimeTD = $("<td class='td-top-border' style='width:36%;'></td>").appendTo($tr);
                                    var $createTimeTD = $("<td class='td-top-border'></td>").appendTo($tr);
                                    $("<div class='animation-td-div'>" + block["no"] + "</div>")
                                        .appendTo($blockTD)
                                        .animate({
                                            opacity: 1,
                                            bottom: 0
                                        }, "slow");
                                    setTimeout((function() {
                                        $("<div class='animation-td-div'>" + block["parsedTime"] + "</div>")
                                            .appendTo($blockTimeTD)
                                            .animate({
                                                opacity: 1,
                                                bottom: 0
                                            }, "slow");
                                    })(block, $blockTimeTD), 200);
                                    setTimeout((function() {
                                        $("<div class='animation-td-div'>" + block["formattedTime"] + "</div>")
                                            .appendTo($createTimeTD)
                                            .animate({
                                                opacity: 1,
                                                bottom: 0
                                            }, "slow");
                                    })(block, $createTimeTD), 400);
                                    //动态添加图表数据
                                    _self.writeData(block);
                                }
                                //图表刷新
                                _self.refreshChart();
                                //overview视图刷新
                                var health = data.health;
                                health = health >= 90 ? "Perfect" : (health >= 80 ? "Good" : "Attention");
                                _self.refreshOverviewLabel($healthLabel, health);
                                _self.refreshOverviewLabel($blockNumLabel, $blocksContainer.children().length);
                                _self.refreshOverviewLabel($avgBlockTimeLabel, _self.avg());
                                _self.refreshOverviewLabel($minBlockTimeLabel, _self.min());
                                _self.refreshOverviewLabel($maxBlockTimeLabel, _self.max());
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
            }
        };
        var fab = new fabric();
        fab.load($chain.data("id"));
        $chainList.find("li").on("click", function() {
            fab.stopRefresh();
            $(this).parents(".uk-dropdown").hide();
            $chain.data("id", $(this).data("id")).html($(this).data("name"));
            fab.load($(this).data("id"));
        });
    });
});