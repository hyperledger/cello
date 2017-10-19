
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
    "plugin/text!resources/dashboard/analytics/chaincode/piedialog.html",
    "plugin/text!resources/dashboard/analytics/chaincode/overlay.html"
], function($, echarts, UI, piedialog, overlay) {
    var ui = new UI();
    var $dialog;
    var $pieDialog;
    var $piePanel;
    var interval = 5000;
    var timer;
    //饼图数据集
    var legends = [], series = [];
    //最新的时间戳
    var latest_ts;

    function pie() {
        this.option = {
            title: {
                text: "Invoke Functions",
                x: "center"
            },
            tooltip: {
                trigger: "item",
                formatter: "{a}<br/>{b}: {c} ({d}%)"
            },
            legend: {
                orient: "vertical",
                left: "left",
                data: legends
            },
            series: {
                name: "Function",
                type: "pie",
                radius: "55%",
                center: ["50%", "60%"],
                data: series,
                itemStyle: {
                    emphasis: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: "rgba(0, 0, 0, 0.5)"
                    }
                }
            }
        };
        this.init = function(chainId, chaincodeId) {
            var _self = this;
            var $overlay = $(overlay);
            $piePanel = $dialog.find(".uk-panel");
            $piePanel.append($overlay);
            //清空当前数据集
            legends = [];
            series = [];
            latest_ts = "";
            $.ajax({
                type: "GET",
                url: "/api/chain/" + chainId + "/analytics/chaincode/" + chaincodeId + "/operations",
                dataType: "json",
                success: function(data) {
                    $overlay.remove();
                    if (data.success) {
                        var operations = data.operations;
                        for (var i in operations) {
                            var ope = operations[i]["name"];
                            var func = operations[i]["function"];
                            if (ope == "Invoke") {
                                _self.writeData(func);
                            }
                            latest_ts = operations[i]["timestamp"];
                        }
                        _self.chart = echarts.init($piePanel[0]);
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
    pie.prototype = {
        show: function($label, chainId, chaincodeId) {
            var _self = this;
            $dialog = $(piedialog);
            $dialog.on({
                "show.uk.modal": function() {
                    _self.init(chainId, chaincodeId);
                },
                "hide.uk.modal": function() {
                    clearTimeout(timer);
                    $(this).remove();
                    var invokeTimes = _self.sum();
                    if (invokeTimes != $label.text()) {
                        $label.animate({
                            opacity: 0,
                            marginTop: 50
                        }, "slow", function() {
                            $(this).text(invokeTimes).css("marginTop", -50).animate({
                                opacity: 1,
                                marginTop: 0
                            }, "slow");
                        });
                    }
                }
            });
            $("body").append($dialog);
            $pieDialog = UIkit.modal($dialog);
            $pieDialog.options.center = true;
            $pieDialog.show();
        },
        writeData: function(func) {
            if (!legends.includes(func)) {
                legends.push(func);
                series.push({
                    name: func,
                    value: 1
                });
            } else {
                for (var i in series) {
                    if (series[i].name == func) {
                        series[i].value++;
                    }
                }
            }
        },
        refreshChart: function() {
            this.option.legend.data = legends.sort();
            this.option.series.data = series;
            this.chart.setOption(this.option);
        },
        sum: function() {
            var sum = 0;
            for (var i in series) {
                sum += series[i].value;
            }
            return sum;
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
                            for (var i in operations) {
                                var ope = operations[i]["name"];
                                var func = operations[i]["function"];
                                if (ope == "Invoke") {
                                    _self.writeData(func);
                                }
                                latest_ts = operations[i]["timestamp"];
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
    return pie;
});