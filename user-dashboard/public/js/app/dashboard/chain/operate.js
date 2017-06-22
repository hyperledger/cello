
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/5.
 */
define([
    "jquery",
    "app/kit/ui",
    "plugin/text!resources/dashboard/chain/operatedialog.html"
], function($, UI, operatedialog) {
    var ui = new UI();
    var $operatedialog;
    var $operateChainDialog;

    function operatechain(list) {
        this.operate = function(action, id) {
            $.ajax({
                type: "GET",
                url: "/api/chain/" + id + "/operate",
                data: {
                    action: action
                },
                dataType: "json",
                success: function(data) {
                    if (data.success) {
                        setTimeout(function() {
                            $operateChainDialog.hide();
                            ui.dialog.success("Operate successfully.", 3000);
                            list.search(list.getCurrentPage());
                        }, 6000);
                    } else {
                        $operateChainDialog.hide();
                        ui.dialog.error(data.message);
                    }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    $operateChainDialog.hide();
                    ui.dialog.error(errorThrown);
                }
            });
        }
    }
    operatechain.prototype = {
        show: function(action, id) {
            var _self = this;
            $operatedialog = $(operatedialog);
            $operatedialog.on({
                "show.uk.modal": function() {
                    _self.operate(action, id);
                },
                "hide.uk.modal": function() {
                    $(this).remove();
                }
            });
            $("body").append($operatedialog);
            $operateChainDialog = UIkit.modal($operatedialog);
            $operateChainDialog.options.center = true;
            $operateChainDialog.options.bgclose = false;
            $operateChainDialog.show();
        }
    };
    return operatechain;
});