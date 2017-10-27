
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
    "plugin/text!resources/dashboard/contract/editdialog.html"
], function($, Cookies, UI, editdialog) {
    var ui = new UI();
    var $editdialog;
    var $editContractDialog;
    var $editContractURL;
    var $editContractName;
    var $editContractDescription;
    var $editContractVersion;
    var $editContractAuthor;
    var $editContractFile;
    var $editUploadContract;
    var $uploadOverlayer;
    var $editSubmit;
    var $editCancel;

    function editcontract(list) {
        function disableAllElement(disabled) {
            if (disabled) {
                $editContractDialog.options.bgclose = false;
            } else {
                $editContractDialog.options.bgclose = true;
            }
            $editContractName.attr("disabled", disabled);
            $editContractDescription.attr("disabled", disabled);
            $editContractVersion.attr("disabled", disabled);
            $editContractAuthor.attr("disabled", disabled);
            if (disabled) {
                $uploadOverlayer.show();
            } else {
                $uploadOverlayer.hide();
            }
            $editSubmit.attr("disabled", disabled);
            $editCancel.attr("disabled", disabled);
        }
        this.init = function(id, name, description, version, author) {
            $editContractURL = $("#edit_contract_url");
            $editContractName = $("#edit_contract_name");
            $editContractDescription = $("#edit_contract_description");
            $editContractVersion = $("#edit_contract_version");
            $editContractAuthor = $("#edit_contract_author");
            $editContractFile = $("#edit_contract_file");
            $editUploadContract = $("#edit_upload_contract");
            $uploadOverlayer = $("#edit_upload_overlayer");
            $editSubmit = $("#edit_contract_submit");
            $editCancel = $("#edit_contract_cancel");

            $editContractName.val(name);
            $editContractDescription.val(description);
            $editContractVersion.val(version);
            $editContractAuthor.val(author);

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
                    disableAllElement(false);
                    if (response.result) {
                        $editContractURL.val(response.url);
                        $editContractFile.html(response.name);
                    } else {
                        ui.dialog.error(response.message);
                    }
                },
                error: function(evt) {
                    disableAllElement(false);
                    ui.dialog.error("Upload failed, please try again later!");
                }
            };
            ui.uploader.upload($editUploadContract, settings);
            $editSubmit.on("click", function() {
                if ($editContractName.val() == "") {
                    ui.dialog.warning("Please input the contract name.");
                    $editContractName.focus();
                    return;
                } else if ($editContractDescription.val() == "") {
                    ui.dialog.warning("Please input the contract description.");
                    $editContractDescription.focus();
                    return;
                } else if ($editContractVersion.val() == "") {
                    ui.dialog.warning("Please input the contract version.");
                    $editContractVersion.focus();
                    return;
                } else if ($editContractAuthor.val() == "") {
                    ui.dialog.warning("Please input the contract author.");
                    $editContractAuthor.focus();
                    return;
                } else {
                    disableAllElement(true);
                    var $spinner = $("<i class='uk-icon-spinner uk-icon-spin'></i>");
                    $(this).append($spinner);
                    $.ajax({
                        type: "POST",
                        url: "/api/" + userInfo.apikey + "/contract/" + id + "/edit",
                        data: {
                            name: $editContractName.val(),
                            description: $editContractDescription.val(),
                            version: $editContractVersion.val(),
                            author: $editContractAuthor.val(),
                            url: $editContractURL.val()
                        },
                        dataType: "json",
                        success: function(data) {
                            $spinner.remove();
                            disableAllElement(false);
                            if (data.success) {
                                $editContractDialog.hide();
                                ui.dialog.success("Edit successfully.", 3000);
                                //Currently because only private contracts can be edited,
                                //so after edited, I only need to refresh private contract list
                                list.search("private", list.getCurrentPage("private"));
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
                }
            });
            $editCancel.on("click", function() {
                $editContractDialog.hide();
            });
        }
    }
    editcontract.prototype = {
        show: function(id, name, description, version, author) {
            var _self = this;
            $editdialog = $(editdialog);
            $editdialog.on({
                "show.uk.modal": function() {
                    _self.init(id, name, description, version, author);
                },
                "hide.uk.modal": function() {
                    $(this).remove();
                }
            });
            $("body").append($editdialog);
            $editContractDialog = UIkit.modal($editdialog);
            $editContractDialog.options.center = true;
            $editContractDialog.show();
        }
    };
    return editcontract;
});