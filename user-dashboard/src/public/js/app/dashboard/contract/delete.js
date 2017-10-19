
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/8.
 */
define([
    "jquery",
    "cookie",
    "app/kit/ui",
    "app/kit/storage",
    "plugin/text!resources/dashboard/contract/deletedialog.html"
], function($, Cookies, UI, Storage, deletedialog) {
    var ui = new UI();
    var storage = new Storage();
    var $deletedialog;
    var $deleteContractDialog;
    var $deleteSubmit;
    var $deleteCancel;

    function deletecontract(list) {
        function disableAllElement(disabled) {
            if (disabled) {
                $deleteContractDialog.options.bgclose = false;
            } else {
                $deleteContractDialog.options.bgclose = true;
            }
            $deleteSubmit.attr("disabled", disabled);
            $deleteCancel.attr("disabled", disabled);
        }
        this.init = function(id) {
            $deleteSubmit = $("#delete_contract_submit");
            $deleteCancel = $("#delete_contract_cancel");

            $deleteSubmit.on("click", function() {
                var $spinner = $("<i class='uk-icon-spinner uk-icon-spin'></i>");
                disableAllElement(true);
                $(this).append($spinner);
                var userInfo = Cookies.getJSON("BlockChainAccount");
                $.ajax({
                    type: "POST",
                    url: "/api/" + userInfo.apikey + "/contract/" + id + "/delete",
                    dataType: "json",
                    success: function(data) {
                        $spinner.remove();
                        disableAllElement(false);
                        if (data.success) {
                            //将存储在本地的函数名和参数删除
                            storage.remove(id);
                            $deleteContractDialog.hide();
                            ui.dialog.success("Delete successfully.", 3000);
                            //Currently because only private contracts can be deleted,
                            //so after deleted, I only need to refresh private contract list
                            list.search("private", 1);
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
            $deleteCancel.on("click", function() {
                $deleteContractDialog.hide();
            });
        }
    }
    deletecontract.prototype = {
        show: function(id) {
            var _self = this;
            $deletedialog = $(deletedialog);
            $deletedialog.on({
                "show.uk.modal": function() {
                    _self.init(id);
                },
                "hide.uk.modal": function() {
                    $(this).remove();
                }
            });
            $("body").append($deletedialog);
            $deleteContractDialog = UIkit.modal($deletedialog);
            $deleteContractDialog.options.center = true;
            $deleteContractDialog.show();
        }
    };
    return deletecontract;
});