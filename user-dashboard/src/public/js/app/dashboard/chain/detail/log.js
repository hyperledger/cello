
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/10.
 */
define([
    "jquery",
    "app/kit/ui",
    "app/dashboard/chain/detail/scrollspy",
    "plugin/text!resources/dashboard/chain/detail/overlay.html",
    "plugin/text!resources/dashboard/chain/detail/largeContainer.html"
], function($, UI, Scrollspy, overlay, largeContainer) {
    var ui = new UI();
    var scrollspy = new Scrollspy();
    var $largeContainer;
    var $expandCompressBtn;
    var $logPanel;
    var $nodeList;
    var $showLatestLogs;
    var interval = 10000;
    var maxSize = 10;
    var buffer = {};
    var timer = {};
    var clocker = {};
    var timestamp = {};

    function log(chainId) {
        this.chainId = chainId;

        $expandCompressBtn = $("#log .expand-compress-icon");
        $logPanel = $("#logPanel");
        $nodeList = $("#logPanel ul");
        $showLatestLogs = $("#showLatestLogs");
        $showLatestLogs.prop("checked", true);

        $expandCompressBtn.on("click", function() {
            $largeContainer = $(largeContainer);
            $largeContainer.find(">div").append($logPanel.detach().css("height", "450px"));
            $largeContainer.on({
                "show.uk.modal": function() {
                    $logPanel.find(">div").css("height", "440px");
                },
                "hide.uk.modal": function() {
                    $("#log").after($logPanel.detach().css("height", "300px"));
                    $(this).remove();
                    $logPanel.find(">div").css("height", "290px");
                }
            });
            $("body").append($largeContainer);
            var $container = UIkit.modal($largeContainer);
            $container.options.center = true;
            $container.show();
        });
        $logPanel.on("inview.uk.scrollspy", function() {
            var $sel = $nodeList.find(".uk-badge-success");
            if ($sel && buffer[$sel.text()] && buffer[$sel.text()].length == 0) {
                this.writeToBuffer($sel.data("type"), $sel.text());
            }
            scrollspy.select("log", true);
        }.bind(this));
        $logPanel.on("outview.uk.scrollspy", function() {
            scrollspy.select("log", false);
        }.bind(this));
    }
    log.prototype = {
        load: function() {
            var _self = this;
            var $overlay = $(overlay);
            $logPanel.append($overlay);
            $.ajax({
                type: "GET",
                url: "/api/chain/" + this.chainId + "/log/nodes",
                dataType: "json",
                success: function(data) {
                    $overlay.remove();
                    if (data.success) {
                        $nodeList.empty();
                        $logPanel.find(">div").remove();
                        for (var i in data.nodes) {
                            var badgeClass = (i == 0) ? "uk-badge-success" : "log-badge-normal";
                            var badgeStyle = (i == 0) ? "border-radius:0 0 0 4px;cursor:pointer;" :
                                "border-radius:0;cursor:pointer;";
                            $("<div class='uk-badge " + badgeClass + "' style='" + badgeStyle + "' " +
                                "data-type='" + data.nodes[i].type + "'>" + data.nodes[i].id +
                            "</div>").click(function() {
                                if (!$(this).hasClass("uk-badge-success")) {
                                    var $sel = $nodeList.find(".uk-badge-success");
                                    $sel.removeClass("uk-badge-success").addClass("log-badge-normal");
                                    $logPanel.find("." + $sel.text()).hide();

                                    $(this).removeClass("log-badge-normal").addClass("uk-badge-success");
                                    $logPanel.find("." + $(this).text()).show();

                                    //刷新当前选择节点的日志
                                    if (buffer[$(this).text()].length == 0) {
                                        _self.writeToBuffer($(this).data("type"),
                                            $(this).text() == "chaincode" ? "vp0": $(this).text());
                                    }
                                }
                            }).appendTo($("<li class='uk-width' style='width:30px;'></li>").appendTo($nodeList));

                            var logContainerStyle = "font-size:11px;height:290px;overflow-x:hidden;overflow-y:auto;";
                            if (i != 0) {
                                logContainerStyle += "display:none;";
                            }
                            $logPanel.append("<div class='" + data.nodes[i].id + "' " +
                                "style='" + logContainerStyle + "'></div>");
                            //初始化log缓冲区
                            buffer[data.nodes[i].id] = [];
                            //初始化每个节点的定时器
                            timer[data.nodes[i].id] = null;
                            //初始化每个节点的刷新显示定时器
                            clocker[data.nodes[i].id] = null;
                            //初始化时间戳
                            timestamp[data.nodes[i].id] = "";
                        }
                    } else {
                        ui.dialog.error(data.message);
                    }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    $overlay.remove();
                    ui.dialog.error(errorThrown);
                }
            });
        },
        writeToBuffer: function(type, nid) {
            clearTimeout(timer[nid]);
            var _self = this;
            $.ajax({
                type: "GET",
                url: "/api/chain/" + this.chainId + "/log",
                data: {
                    type: type,
                    node: nid,
                    size: maxSize,
                    time: timestamp[nid]
                },
                dataType: "json",
                success: function(data) {
                    if (data.success) {
                        timestamp[nid] = data.latest_ts;
                        var logs = data.logs;
                        for (var i in logs) {
                            if (logs[i].log_data.trim() != "") {
                                buffer[nid].push("【" + logs[i].log_level + "】" +
                                    "【" + logs[i].module + "】" +
                                    logs[i].log_data);
                            }
                        }
                        _self.showFromBuffer(nid, buffer[nid].length);
                        timer[nid] = setTimeout(function() { _self.writeToBuffer(type, nid) }, interval);
                    } else {
                        ui.dialog.error("Log error: " + data.message);
                    }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    ui.dialog.error(errorThrown, 2000);
                }
            });
        },
        /**
         * 将buffer中的log显示出来
         */
        showFromBuffer: function(nid, size) {
            clearInterval(clocker[nid]);
            if (size > 0) {
                var $logContainer = $logPanel.find("." + nid);
                clocker[nid] = setInterval(function() {
                    if (buffer[nid].length > 0) {
                        $logContainer.append("<label>" + buffer[nid].shift() + "</label><br>");
                        //最多保留500条log记录
                        var len = $logContainer.children("label").length;
                        if (len > 500) {
                            $logContainer.children("label").slice(0, 1).remove();
                            $logContainer.children("br").slice(0, 1).remove();
                        }
                        //是否总是显示最新的log
                        if ($showLatestLogs.prop("checked")) {
                            $logContainer.scrollTop($logContainer[0].scrollHeight);
                        }
                    }
                }, interval / size);
            }
        }
    };
    return log;
});