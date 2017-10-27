
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/12.
 */
define([
    "jquery",
    "echarts",
    "app/kit/ui",
    "plugin/text!resources/dashboard/analytics/chaincode/bardialog.html",
    "plugin/text!resources/dashboard/analytics/chaincode/operation.html",
    "plugin/text!resources/dashboard/analytics/chaincode/overlay.html",
    "app/kit/array",
    "lodash"
], function($, echarts, UI, bardialog, operation, overlay) {
    var ui = new UI();
    var $dialog;
    var $barDialog;
    var $barPanel;
    var $operationContainer;
    var $canvas;
    var interval = 5000;
    var timer;
    var sampling = 10;
    //柱图数据集
    var xAxisData = [], series = [];
    var responseTimes = [];
    //最新的时间戳
    var latest_ts;

    function bar() {
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
                                (params[i].data ? params[i].data.label : "N/A") +
                                " @ " + params[i].name;
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
                data: ["Response Time"]
            },
            grid: {
                left: 25,
                right: 0,
                top: 20,
                bottom: 20
            },
            xAxis: {
                type: "category",
                axisLabel: { textStyle: { fontSize: 10 } },
                data: xAxisData
            },
            yAxis: {
                type: "value",
                name: "Time(ms)",
                nameGap: 10,
                nameTextStyle: { fontSize: 10 },
                axisLabel: { textStyle: { fontSize: 10 } }
            },
            series: {
                name: "Response Time",
                type: "bar",
                barWidth: 25,
                data: series
            }
        };
        this.init = function(chainId, chaincodeId) {
            var _self = this;
            var $overlay = $(overlay);
            $operationContainer = $dialog.find("tbody");
            $canvas = $dialog.find(".canvas");
            $barPanel = $dialog.find(".uk-panel");
            $barPanel.append($overlay);
            //清空当前数据集
            xAxisData = [];
            series = [];
            responseTimes = [];
            latest_ts = "";
            $.ajax({
                type: "GET",
                url: "/api/chain/" + chainId + "/analytics/chaincode/" + chaincodeId + "/operations",
                dataType: "json",
                success: function(data) {
                    $overlay.remove();
                    if (data.success) {
                        var operations = data.operations;
                        var opeInfo = _.template(operation);
                        for (var i=operations.length-1; i>=0; i--) {
                            var responseTime = operations[i]["response_time"];
                            if (parseFloat(responseTime) >= 1) {
                                responseTime = parseFloat(responseTime.toFixed(2)) + "s";
                            } else {
                                responseTime = (parseFloat(responseTime.toFixed(3)) * 1000) + "ms";
                            }
                            $operationContainer.append(opeInfo({
                                name: operations[i]["name"],
                                func: operations[i]["function"],
                                responseTime: responseTime,
                                operationTime: operations[i]["formattedTime"]
                            }));
                        }
                        _self.chart = echarts.init($canvas[0]);
                        for (var i in operations) {
                            _self.writeData(operations[i]);
                        }
                        _self.refreshChart();
                        timer = setTimeout(function() { _self.refresh(chainId, chaincodeId); }, interval);
                    } else {
                        ui.dialog.error(data.message);
                    }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    $overlay.remove();
                    ui.dialog.error(errorThrown);
                }
            });
        }
    }
    bar.prototype = {
        show: function($label, chainId, chaincodeId) {
            var _self = this;
            $dialog = $(bardialog);
            $dialog.on({
                "show.uk.modal": function() {
                    _self.init(chainId, chaincodeId);
                },
                "hide.uk.modal": function() {
                    clearTimeout(timer);
                    $(this).remove();
                    var avgResponseTime = _self.avg();
                    avgResponseTime += "s";
                    if (avgResponseTime != $label.text()) {
                        $label.animate({
                            opacity: 0,
                            marginTop: 50
                        }, "slow", function() {
                            $(this).text(avgResponseTime).css("marginTop", -50).animate({
                                opacity: 1,
                                marginTop: 0
                            }, "slow");
                        });
                    }
                }
            });
            $("body").append($dialog);
            $barDialog = UIkit.modal($dialog);
            $barDialog.options.center = true;
            $barDialog.show();
        },
        writeData: function(operation) {
            if (operation["name"] == "Invoke") {
                var responseTime = parseFloat(operation["response_time"].toFixed(3)) * 1000;
                xAxisData.extrude(sampling, operation["formattedTime"].substring(0, 8));
                series.extrude(sampling, {
                    value: responseTime,
                    label: operation["name"] + " - " + operation["function"] + " : " + responseTime + "ms"
                });
            }
            responseTimes.push(operation["response_time"]);
            latest_ts = operation["timestamp"];
        },
        refreshChart: function() {
            this.option.xAxis.data = xAxisData;
            this.option.series.data = series;
            this.chart.setOption(this.option);
        },
        avg: function() {
            var avg = 0;
            for (var i=0; i<responseTimes.length; i++) {
                avg += responseTimes[i];
            }
            if (responseTimes.length > 0) avg = avg / responseTimes.length;
            return parseFloat(avg.toFixed(2));
        },
        refresh: function(chainId, chaincodeId) {
            var _self = this;
            clearTimeout(timer);
            $.ajax({
                type: "GET",
                url: "/api/chain/" + chainId + "/analytics/chaincode/" + chaincodeId + "/operations",
                data: {
                    timestamp: latest_ts
                },
                dataType: "json",
                success: function(data) {
                    if (data.success) {
                        var operations = data.operations;
                        if (operations.length) {
                            for (var i=0; i<operations.length; i++) {
                                //动态加载表格数据
                                var op = operations[i]["name"];
                                var func = operations[i]["function"];
                                var responseTime = operations[i]["response_time"];
                                if (parseFloat(responseTime) >= 1) {
                                    responseTime = parseFloat(responseTime.toFixed(2)) + "s";
                                } else {
                                    responseTime = (parseFloat(responseTime.toFixed(3)) * 1000) + "ms";
                                }
                                var operationTime = operations[i]["formattedTime"];

                                var $tr = $("<tr></tr>").prependTo($operationContainer);
                                var $opTD = $("<td class='td-top-border' style='width:20%;'></td>").appendTo($tr);
                                var $functionTD = $("<td class='td-top-border' style='width:23%;'></td>").appendTo($tr);
                                var $responseTimeTD = $("<td class='td-top-border' style='width:28%;'></td>").appendTo($tr);
                                var $operationTimeTD = $("<td class='td-top-border'></td>").appendTo($tr);

                                $("<div class='animation-td-div'>" + op + "</div>")
                                    .appendTo($opTD)
                                    .animate({
                                        opacity: 1,
                                        bottom: 0
                                    }, "slow");
                                setTimeout((function() {
                                    $("<div class='uk-text-truncate animation-td-div' style='width:78px;' " +
                                        "data-uk-tooltip=\"{pos:'bottom-left'}\" title='" + func + "'>" + func + "</div>")
                                        .appendTo($functionTD)
                                        .animate({
                                            opacity: 1,
                                            bottom: 0
                                        }, "slow");
                                })(func, $functionTD), 200);
                                setTimeout((function() {
                                    $("<div class='animation-td-div'>" + responseTime + "</div>")
                                        .appendTo($responseTimeTD)
                                        .animate({
                                            opacity: 1,
                                            bottom: 0
                                        }, "slow");
                                })(responseTime, $responseTimeTD), 400);
                                setTimeout((function() {
                                    $("<div class='animation-td-div'>" + operationTime + "</div>")
                                        .appendTo($operationTimeTD)
                                        .animate({
                                            opacity: 1,
                                            bottom: 0
                                        }, "slow");
                                })(operationTime, $operationTimeTD), 600);
                                //图表刷新
                                _self.writeData(operations[i]);
                            }
                            _self.refreshChart();
                        }
                        timer = setTimeout(function() { _self.refresh(chainId, chaincodeId); }, interval);
                    } else {
                        ui.dialog.error(data.message);
                    }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    ui.dialog.error(errorThrown);
                }
            });
        }
    };
    return bar;
});