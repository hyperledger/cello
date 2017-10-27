
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
    "plugin/text!resources/dashboard/contract/uploaddialog.html"
], function($, Cookies, UI, uploaddialog) {
    var ui = new UI();
    var $uploaddialog;
    var $uploadContractDialog;
    var $contractName;
    var $contractDescription;
    var $contractVersion;
    var $contractAuthor;
    var $uploadContract;
    var $uploadOverlayer;
    var $uploadSubmit;
    var $uploadCancel;

    function uploadcontract(list) {
        function disableAllElement(disabled) {
            if (disabled) {
                $uploadContractDialog.options.bgclose = false;
            } else {
                $uploadContractDialog.options.bgclose = true;
            }
            $contractName.attr("disabled", disabled);
            $contractDescription.attr("disabled", disabled);
            $contractVersion.attr("disabled", disabled);
            $contractAuthor.attr("disabled", disabled);
            if (disabled) {
                $uploadOverlayer.show();
            } else {
                $uploadOverlayer.hide();
            }
            $uploadSubmit.attr("disabled", disabled);
            $uploadCancel.attr("disabled", disabled);
        }
        this.init = function() {
            $contractName = $("#contract_name");
            $contractDescription = $("#contract_description");
            $contractVersion = $("#contract_version");
            $contractAuthor = $("#contract_author");
            $uploadContract = $("#upload_contract");
            $uploadOverlayer = $("#upload_overlayer");
            $uploadSubmit = $("#upload_contract_submit");
            $uploadCancel = $("#upload_contract_cancel");

            $contractAuthor.val($("#welcomeInfo").text());
            $uploadContract.on("click", function() {
                if ($contractName.val() == "") {
                    ui.dialog.warning("Please input the contract name.");
                    $contractName.focus();
                    return false;
                } else if ($contractDescription.val() == "") {
                    ui.dialog.warning("Please input the contract description.");
                    $contractDescription.focus();
                    return false;
                } else if ($contractVersion.val() == "") {
                    ui.dialog.warning("Please input the contract version.");
                    $contractVersion.focus();
                    return false;
                } else if ($contractAuthor.val() == "") {
                    ui.dialog.warning("Please input the contract author.");
                    $contractAuthor.focus();
                    return false;
                }
            });
            var userInfo = Cookies.getJSON("BlockChainAccount");
            var settings = {
                action: "/api/" + userInfo.apikey + "/contract/upload",
                param: "smartcontract",
                allow: "*.go",
                type: "json",
                notallowed: function(file, settings) {
                    ui.dialog.warning("Only the following file types are allowed: " + settings.allow);
                },
                loadstart: function(evt) {
                    disableAllElement(true);
                },
                allcomplete: function(response) {
                    if (response.result) {
                        var $spinner = $("<i class='uk-icon-spinner uk-icon-spin'></i>");
                        $uploadSubmit.append($spinner);
                        $.ajax({
                            type: "POST",
                            url: "/api/" + userInfo.apikey + "/contract/create",
                            data: {
                                name: $contractName.val(),
                                description: $contractDescription.val(),
                                version: $contractVersion.val(),
                                author: $contractAuthor.val(),
                                url: response.url
                            },
                            dataType: "json",
                            success: function(data) {
                                $spinner.remove();
                                disableAllElement(false);
                                if (data.success) {
                                    $uploadContractDialog.hide();
                                    ui.dialog.success("Import successfully.", 3000);
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
                    } else {
                        disableAllElement(false);
                        ui.dialog.error(response.message);
                    }
                },
                error: function(evt) {
                    disableAllElement(false);
                    ui.dialog.error("Upload failed, please try again later!");
                }
            };
            ui.uploader.upload($uploadContract, settings);
            $uploadCancel.on("click", function() {
                $uploadContractDialog.hide();
            });
        }
    }
    uploadcontract.prototype = {
        show: function() {
            var _self = this;
            $uploaddialog = $(uploaddialog);
            $uploaddialog.on({
                "show.uk.modal": function() {
                    _self.init();
                },
                "hide.uk.modal": function() {
                    $(this).remove();
                }
            });
            $("body").append($uploaddialog);
            $uploadContractDialog = UIkit.modal($uploaddialog);
            $uploadContractDialog.options.center = true;
            $uploadContractDialog.show();
        }
    };
    return uploadcontract;
});