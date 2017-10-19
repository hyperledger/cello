
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/12.
 */
define([
    "jquery",
    "app/kit/ui",
    "app/kit/overlayer",
    "app/dashboard/profile",
    "app/dashboard/analytics/chaincode/pie",
    "app/dashboard/analytics/chaincode/bar",
    "plugin/text!resources/dashboard/analytics/chaincode/overview.html",
    "plugin/text!resources/dashboard/analytics/chaincode/chaincode.html",
    "uikit",
    "lodash"
], function($, UI, Overlayer, Profile, Pie, Bar, overview, chaincode) {
    $(function() {
        new Profile();

        var ui = new UI();
        var pie = new Pie();
        var bar = new Bar();
        var $chain = $("#chainSelector button label");
        var $chainList = $("#chainSelector ul");
        var $analyticsPanel = $("#analyticsPanel");

        function load(id) {
            var overlayer = new Overlayer();
            overlayer.show();
            $.ajax({
                type: "GET",
                url: "/api/chain/" + id + "/analytics/chaincode/list",
                dataType: "json",
                success: function(data) {
                    overlayer.hide();
                    $analyticsPanel.empty();
                    if (data.success) {
                        var chaincodes = data.chaincodes;
                        if (chaincodes.length == 0) {
                            $analyticsPanel.append("<label class='uk-margin-large-top empty'>No result.</label>");
                        } else {
                            var invokeTimes = 0, responseTime = 0;
                            for (var i in chaincodes) {
                                invokeTimes += parseInt(chaincodes[i].invoke_times);
                                responseTime += parseFloat(chaincodes[i].avg_response_time);
                            }
                            var overviewInfo = _.template(overview);
                            $analyticsPanel.append(overviewInfo({
                                chaincodeNum: chaincodes.length,
                                invokeTimes: invokeTimes,
                                avgResponseTime: parseFloat((responseTime / chaincodes.length).toFixed(2))
                            }));
                            var $chaincodesContainer = $analyticsPanel.find("tbody");
                            var chaincodeInfo = _.template(chaincode);
                            for (var i in chaincodes) {
                                $chaincodesContainer.append(chaincodeInfo({
                                    id: chaincodes[i].id,
                                    name: chaincodes[i].name,
                                    invokeTimes: chaincodes[i].invoke_times,
                                    responseTime: parseFloat(chaincodes[i].avg_response_time.toFixed(2))
                                }));
                            }
                        }
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
        }
        $chainList.find("li").on("click", function() {
            $(this).parents(".uk-dropdown").hide();
            $chain.data("id", $(this).data("id")).html($(this).data("name"));
            load($(this).data("id"));
        });
        $analyticsPanel.on("click", "tbody button", function() {
            if ($(this).data("type") == "functions") {
                var $label = $(this).closest("tr").find("label.invokeTimes");
                pie.show($label, $chain.data("id"), $(this).data("id"));
            } else if ($(this).data("type") == "responseTime") {
                var $label = $(this).closest("tr").find("label.responseTime");
                bar.show($label, $chain.data("id"), $(this).data("id"));
            }
        });
    });
});