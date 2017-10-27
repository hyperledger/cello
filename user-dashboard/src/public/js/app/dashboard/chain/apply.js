
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
    "plugin/text!resources/dashboard/chain/applydialog.html"
], function($, Cookies, UI, applydialog) {
    var ui = new UI();
    var $applydialog;
    var $applyChainDialog;
    var $chainName;
    var $consensusPlugin;
    var $consensusModeView;
    var $consensusMode;
    var $chainSize;
    var $chainCost;
    var $chainDescription;
    var $applySubmit;
    var $applyCancel;

    function applychain(list) {
        function disableAllElement(disabled) {
            if (disabled) {
                $applyChainDialog.options.bgclose = false;
            } else {
                $applyChainDialog.options.bgclose = true;
            }
            $chainName.attr("disabled", disabled);
            $consensusPlugin.attr("disabled", disabled);
            $consensusMode.attr("disabled", disabled);
            $chainSize.attr("disabled", disabled);
            $chainDescription.attr("disabled", disabled);
            $applySubmit.attr("disabled", disabled);
            $applyCancel.attr("disabled", disabled);
        }
        this.init = function() {
            $chainName = $("#chain_name");
            $consensusPlugin = $("#consensus_plugin");
            $consensusModeView = $("#consensus_mode_view");
            $consensusMode = $("#consensus_mode");
            $chainSize = $("#chain_size");
            $chainCost = $("#chain_cost");
            $chainDescription = $("#chain_description");
            $applySubmit = $("#apply_chain_submit");
            $applyCancel = $("#apply_chain_cancel");

            $consensusPlugin.change(function() {
                var val = 40;
                if ($(this).val() == "noops") {
                    $consensusModeView.fadeOut(200, function() {
                        $consensusMode.empty();
                    });
                    if ($chainSize.val() == "4") {
                        val = 40;
                    } else if ($chainSize.val() == "6") {
                        val = 60;
                    }
                } else if ($(this).val() == "pbft") {
                    $consensusMode.empty().append("<option value='batch'>batch</option>");
                    $consensusModeView.fadeIn(200);
                    if ($chainSize.val() == "4") {
                        val = 80;
                    } else if ($chainSize.val() == "6") {
                        val = 120;
                    }
                }
                $chainCost.text(val + " / day");
            });
            $chainSize.change(function() {
                var val = 40;
                if ($(this).val() == "4") {
                    if ($consensusPlugin.val() == "noops") {
                        val = 40;
                    } else if ($consensusPlugin.val() == "pbft") {
                        val = 80;
                    }
                } else if ($(this).val() == "6") {
                    if ($consensusPlugin.val() == "noops") {
                        val = 60;
                    } else if ($consensusPlugin.val() == "pbft") {
                        val = 120;
                    }
                }
                $chainCost.text(val + " / day");
            });
            $applySubmit.on("click", function() {
                if ($chainName.val() == "") {
                    ui.dialog.warning("Please input the chain name.");
                    $chainName.focus();
                    return;
                }
                var $spinner = $("<i class='uk-icon-spinner uk-icon-spin'></i>");
                disableAllElement(true);
                $(this).append($spinner);
                var userInfo = Cookies.getJSON("BlockChainAccount");
                $.ajax({
                    type: "POST",
                    url: "/api/" + userInfo.apikey + "/chain/apply",
                    data: {
                        name: $chainName.val(),
                        plugin: $consensusPlugin.val(),
                        mode: $consensusMode.val(),
                        size: $chainSize.val(),
                        description: $chainDescription.val()
                    },
                    dataType: "json",
                    success: function(data) {
                        $spinner.remove();
                        disableAllElement(false);
                        if (data.success) {
                            $applyChainDialog.hide();
                            ui.dialog.success("Apply successfully.", 3000);
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
            $applyCancel.on("click", function() {
                $applyChainDialog.hide();
            });
        }
    }
    applychain.prototype = {
        show: function() {
            var _self = this;
            $applydialog = $(applydialog);
            $applydialog.on({
                "show.uk.modal": function() {
                    _self.init();
                },
                "hide.uk.modal": function() {
                    $(this).remove();
                }
            });
            $("body").append($applydialog);
            $applyChainDialog = UIkit.modal($applydialog);
            $applyChainDialog.options.center = true;
            $applyChainDialog.show();
        }
    };
    return applychain;
});