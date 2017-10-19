
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/10.
 */
define([
    "jquery",
    "app/dashboard/chain/detail/scrollspy",
    "plugin/text!resources/dashboard/chain/detail/largeContainer.html"
], function($, Scrollspy, largeContainer) {
    var scrollspy = new Scrollspy();
    var $largeContainer;
    var $expandCompressBtn;
    var $apiPanel;

    function api() {
        $expandCompressBtn = $("#api .expand-compress-icon");
        $apiPanel = $("#apiPanel");

        $expandCompressBtn.on("click", function() {
            $largeContainer = $(largeContainer);
            $largeContainer.find(">div").append($apiPanel.detach().css("height", "450px"));
            $largeContainer.on({
                "hide.uk.modal": function() {
                    $("#api").after($apiPanel.detach().css("height", "300px"));
                    $(this).remove();
                }
            });
            $("body").append($largeContainer);
            var $container = UIkit.modal($largeContainer);
            $container.options.center = true;
            $container.show();
        });
        $apiPanel.on("inview.uk.scrollspy", function() {
            scrollspy.select("apis", true);
        });
        $apiPanel.on("outview.uk.scrollspy", function() {
            scrollspy.select("apis", false);
        });
    }
    return api;
});