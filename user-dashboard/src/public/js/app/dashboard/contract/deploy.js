
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
    "app/kit/common",
    "app/kit/storage",
    "plugin/text!resources/dashboard/contract/deploydialog.html",
    "lodash"
], function($, Cookies, UI, Common, Storage, deploydialog) {
    var ui = new UI();
    var common = new Common();
    var storage = new Storage();
    var $deploydialog;
    var $deployContractDialog;
    var $deployChain;
    var $instanceName;
    var $deployFunction;
    var $functionListDropdown;
    var $functionList;
    var $deployArgument;
    var $deploySubmit;
    var $deployCancel;

    function deploycontract() {
        function disableAllElement(disabled) {
            if (disabled) {
                $deployContractDialog.options.bgclose = false;
            } else {
                $deployContractDialog.options.bgclose = true;
            }
            $deployChain.attr("disabled", disabled);
            $instanceName.attr("disabled", disabled);
            $deployFunction.attr("disabled", disabled);
            $deployArgument.attr("disabled", disabled);
            $deploySubmit.attr("disabled", disabled);
            $deployCancel.attr("disabled", disabled);
        }
        function loadChain() {
            var userInfo = Cookies.getJSON("BlockChainAccount");
            disableAllElement(true);
            $.ajax({
                type: "GET",
                url: "/api/" + userInfo.apikey + "/chain/list",
                data: {
                    page: -1
                },
                dataType: "json",
                success: function(data) {
                    disableAllElement(false);
                    if (data.success) {
                        $deployChain.empty();
                        for (var i in data.chains) {
                            var chain = data.chains[i];
                            $deployChain.append("<option value='" + chain.id + "'>" + chain.name + "</option>");
                        }
                    } else {
                        ui.dialog.error(data.message);
                    }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    disableAllElement(false);
                    ui.dialog.error(errorThrown);
                }
            });
        }
        this.init = function(id) {
            $deployChain = $("#deploy_contract_chain");
            $instanceName = $("#deploy_contract_instance_name");
            $deployFunction = $("#deploy_contract_function");
            $functionListDropdown = $("#deploy_function_dropdown");
            $functionList = $("#deploy_function_dropdown ul");
            $deployArgument = $("#deploy_contract_argument");
            $deploySubmit = $("#deploy_contract_submit");
            $deployCancel = $("#deploy_contract_cancel");

            loadChain();
            //从本地存储中获取到函数名和参数
            var deploy = storage.get("deploy", id);
            $functionList.empty();
            for (var i in deploy) {
                $("<li data-args='" + _.escape(JSON.stringify(deploy[i].args)) + "'>" +
                    "<a>" + deploy[i].func + "</a>" +
                "</li>").click(function() {
                    $deployFunction.val($(this).find("a").text());
                    $deployArgument.val(JSON.stringify($(this).data("args")));
                }).appendTo($functionList);
            }
            $deployFunction.on("focus blur", function(evt) {
                if ($functionList.children().length > 0) {
                    if (evt.type == "focus") {
                        $functionListDropdown.show();
                    } else if (evt.type == "blur") {
                        setTimeout(function() {
                            $functionListDropdown.hide();
                        }, 200);
                    }
                }
            });
            $deploySubmit.on("click", function() {
                if (!$deployChain.val()) {
                    ui.dialog.warning("Please select a chain.");
                    $deployChain.focus();
                    return;
                } else if ($instanceName.val() == "") {
                    ui.dialog.warning("Please input the instance name.");
                    $instanceName.focus();
                    return;
                } else if ($deployFunction.val() == "") {
                    ui.dialog.warning("Please input the function name.");
                    $deployFunction.focus();
                    return;
                } else if ($deployArgument.val() == "") {
                    ui.dialog.warning("Please input the function arguments.");
                    $deployArgument.focus();
                    return;
                }
                var deployArgs = common.parseJSON($deployArgument.val());
                if (!deployArgs) {
                    ui.dialog.warning("Please input valid function arguments.");
                    $deployArgument.focus();
                    return;
                }
                var $spinner = $("<i class='uk-icon-spinner uk-icon-spin'></i>");
                disableAllElement(true);
                $(this).append($spinner);
                $.ajax({
                    type: "POST",
                    url: "/api/contract/" + id + "/deploy",
                    data: {
                        chain: $deployChain.val(),
                        name: $instanceName.val(),
                        func: $deployFunction.val(),
                        args: $deployArgument.val()
                    },
                    dataType: "json",
                    success: function(data) {
                        $spinner.remove();
                        disableAllElement(false);
                        if (data.success) {
                            //本地存储用户输入的函数名和参数
                            storage.set("deploy", id, {
                                func: $deployFunction.val(),
                                args: deployArgs
                            });
                            $deployContractDialog.hide();
                            ui.dialog.success("Deploy successfully.", 3000);
                            setTimeout(function() {
                                $(location).attr("href", "/dashboard/chain/" + $deployChain.val());
                            }, 1000);
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
            $deployCancel.on("click", function() {
                $deployContractDialog.hide();
            });
        }
    }
    deploycontract.prototype = {
        show: function(id) {
            var _self = this;
            $deploydialog = $(deploydialog);
            $deploydialog.on({
                "show.uk.modal": function() {
                    _self.init(id);
                },
                "hide.uk.modal": function() {
                    $(this).remove();
                }
            });
            $("body").append($deploydialog);
            $deployContractDialog = UIkit.modal($deploydialog);
            $deployContractDialog.options.center = true;
            $deployContractDialog.show();
        }
    };
    return deploycontract;
});