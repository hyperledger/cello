
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/5.
 */
define([
    "jquery",
    "cookie",
    "app/kit/ui",
    "app/kit/storage",
    "plugin/text!resources/dashboard/chain/releasedialog.html"
], function($, Cookies, UI, Storage, releasedialog) {
    var ui = new UI();
    var storage = new Storage();
    var $releasedialog;
    var $releaseChainDialog;
    var $releaseSubmit;
    var $releaseCancel;

    function releasechain(list) {
        function disableAllElement(disabled) {
            if (disabled) {
                $releaseChainDialog.options.bgclose = false;
            } else {
                $releaseChainDialog.options.bgclose = true;
            }
            $releaseSubmit.attr("disabled", disabled);
            $releaseCancel.attr("disabled", disabled);
        }
        this.init = function(id) {
            $releaseSubmit = $("#release_chain_submit");
            $releaseCancel = $("#release_chain_cancel");

            $releaseSubmit.on("click", function() {
                var $spinner = $("<i class='uk-icon-spinner uk-icon-spin'></i>");
                disableAllElement(true);
                $(this).append($spinner);
                var userInfo = Cookies.getJSON("BlockChainAccount");
                $.ajax({
                    type: "POST",
                    url: "/api/" + userInfo.apikey + "/chain/" + id + "/release",
                    dataType: "json",
                    success: function(data) {
                        $spinner.remove();
                        disableAllElement(false);
                        if (data.success) {
                            //将存储在本地的函数名和参数删除
                            storage.remove(id);
                            $releaseChainDialog.hide();
                            ui.dialog.success("Release successfully.", 3000);
                            list.search(1);
                        } else {
                            ui.dialog.error(data.message);
                        }
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        $spinner.remove();
                        disableAllElement(false);
                        ui.dialog.error(errorThrown);
                    }
                });
            });
            $releaseCancel.on("click", function() {
                $releaseChainDialog.hide();
            });
        }
    }
    releasechain.prototype = {
        show: function(id) {
            var _self = this;
            $releasedialog = $(releasedialog);
            $releasedialog.on({
                "show.uk.modal": function() {
                    _self.init(id);
                },
                "hide.uk.modal": function() {
                    $(this).remove();
                }
            });
            $("body").append($releasedialog);
            $releaseChainDialog = UIkit.modal($releasedialog);
            $releaseChainDialog.options.center = true;
            $releaseChainDialog.show();
        }
    };
    return releasechain;
});