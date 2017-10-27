
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
    "plugin/text!resources/dashboard/chain/editdialog.html"
], function($, Cookies, UI, editdialog) {
    var ui = new UI();
    var $editdialog;
    var $editChainDialog;
    var $editChainName;
    var $editChainDescription;
    var $editSubmit;
    var $editCancel;

    function editchain(list) {
        function disableAllElement(disabled) {
            if (disabled) {
                $editChainDialog.options.bgclose = false;
            } else {
                $editChainDialog.options.bgclose = true;
            }
            $editChainName.attr("disabled", disabled);
            $editChainDescription.attr("disabled", disabled);
            $editSubmit.attr("disabled", disabled);
            $editCancel.attr("disabled", disabled);
        }
        this.init = function(id, name, description) {
            $editChainName = $("#edit_chain_name");
            $editChainDescription = $("#edit_chain_description");
            $editSubmit = $("#edit_chain_submit");
            $editCancel = $("#edit_chain_cancel");

            $editChainName.val(name);
            $editChainDescription.val(description);

            $editSubmit.on("click", function() {
                if ($editChainName.val() == "") {
                    ui.dialog.warning("Please input the chain name.");
                    $editChainName.focus();
                    return;
                }
                var $spinner = $("<i class='uk-icon-spinner uk-icon-spin'></i>");
                disableAllElement(true);
                $(this).append($spinner);
                var userInfo = Cookies.getJSON("BlockChainAccount");
                $.ajax({
                    type: "POST",
                    url: "/api/" + userInfo.apikey + "/chain/" + id + "/edit",
                    data: {
                        name: $editChainName.val(),
                        description: $editChainDescription.val()
                    },
                    dataType: "json",
                    success: function(data) {
                        $spinner.remove();
                        disableAllElement(false);
                        if (data.success) {
                            $editChainDialog.hide();
                            ui.dialog.success("Edit successfully.", 3000);
                            list.search(list.getCurrentPage());
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
            $editCancel.on("click", function() {
                $editChainDialog.hide();
            });
        }
    }
    editchain.prototype = {
        show: function(id, name, description) {
            var _self = this;
            $editdialog = $(editdialog);
            $editdialog.on({
                "show.uk.modal": function() {
                    _self.init(id, name, description);
                },
                "hide.uk.modal": function() {
                    $(this).remove();
                }
            });
            $("body").append($editdialog);
            $editChainDialog = UIkit.modal($editdialog);
            $editChainDialog.options.center = true;
            $editChainDialog.show();
        }
    };
    return editchain;
});