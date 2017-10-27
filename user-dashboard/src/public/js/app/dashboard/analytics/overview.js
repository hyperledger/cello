
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
    "plugin/text!resources/dashboard/analytics/overview.html",
    "uikit",
    "lodash"
], function($, UI, Overlayer, Profile, overview) {
    $(function() {
        new Profile();

        var ui = new UI();
        var $chain = $("#chainSelector button label");
        var $chainList = $("#chainSelector ul");
        var $analyticsPanel = $("#analyticsPanel");

        function load(id) {
            var overlayer = new Overlayer();
            overlayer.show();
            $.ajax({
                type: "GET",
                url: "/api/chain/" + id + "/analytics",
                dataType: "json",
                success: function(data) {
                    overlayer.hide();
                    $analyticsPanel.empty();
                    if (data.success) {
                        var statistic = data.statistic;
                        var overviewInfo = _.template(overview);
                        $analyticsPanel.append(overviewInfo({
                            health: statistic.health,
                            runTime: statistic.runTime,
                            chaincodes: statistic.chaincodes,
                            blocks: statistic.blocks
                        }));
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
    });
});