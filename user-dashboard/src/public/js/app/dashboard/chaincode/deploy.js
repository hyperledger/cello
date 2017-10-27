
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/10.
 */
define([
    "jquery",
    "cookie",
    "app/kit/ui",
    "app/kit/common",
    "app/kit/storage",
    "plugin/text!resources/dashboard/chaincode/deploydialog.html",
    "lodash"
], function($, Cookies, UI, Common, Storage, deploydialog) {
    var ui = new UI();
    var common = new Common();
    var storage = new Storage();
    var $deploydialog;
    var $deployChaincodeDialog;
    var $deployContract;
    var $instanceName;
    var $deployFunction;
    var $functionListDropdown;
    var $functionList;
    var $deployArgument;
    var $deploySubmit;
    var $deployCancel;

    function deploychaincode(list) {
        function disableAllElement(disabled) {
            if (disabled) {
                $deployChaincodeDialog.options.bgclose = false;
            } else {
                $deployChaincodeDialog.options.bgclose = true;
            }
            $deployContract.attr("disabled", disabled);
            $instanceName.attr("disabled", disabled);
            $deployFunction.attr("disabled", disabled);
            $deployArgument.attr("disabled", disabled);
            $deploySubmit.attr("disabled", disabled);
            $deployCancel.attr("disabled", disabled);
        }
        function injectFunction(contractId) {
            //从本地存储中获取到函数名和参数
            var deploy = storage.get("deploy", contractId);
            $functionList.empty();
            for (var i in deploy) {
                $("<li data-args='" + _.escape(JSON.stringify(deploy[i].args)) + "'>" +
                    "<a>" + deploy[i].func + "</a>" +
                "</li>").click(function() {
                    $deployFunction.val($(this).find("a").text());
                    $deployArgument.val(JSON.stringify($(this).data("args")));
                }).appendTo($functionList);
            }
        }
        function loadContract() {
            var userInfo = Cookies.getJSON("BlockChainAccount");
            disableAllElement(true);
            $.ajax({
                type: "GET",
                url: "/api/" + userInfo.apikey + "/contract/list",
                dataType: "json",
                success: function(data) {
                    disableAllElement(false);
                    if (data.success) {
                        $deployContract.empty();
                        if (data["public"]) {
                            for (var i in data["public"]) {
                                var contract = data["public"][i];
                                $deployContract.append(
                                    "<option value='" + contract.id + "'>" +
                                        contract.name + " (" + contract.version + ")" +
                                    "</option>");
                                //将默认函数名和参数存储到本地
                                storage.save("deploy", contract.id, contract.deploy);
                            }
                        }
                        if (data["private"]) {
                            for (var i in data["private"]) {
                                var contract = data["private"][i];
                                $deployContract.append(
                                    "<option value='" + contract.id + "'>" +
                                        contract.name + " (" + contract.version + ")" +
                                    "</option>");
                                //将默认函数名和参数存储到本地
                                storage.save("deploy", contract.id, contract.deploy);
                            }
                        }
                        injectFunction($deployContract.val());
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
        this.init = function() {
            $deployContract = $("#deploy_chaincode_contract");
            $instanceName = $("#deploy_chaincode_instance_name");
            $deployFunction = $("#deploy_chaincode_function");
            $functionListDropdown = $("#chaincode_function_dropdown");
            $functionList = $("#chaincode_function_dropdown ul");
            $deployArgument = $("#deploy_chaincode_argument");
            $deploySubmit = $("#deploy_chaincode_submit");
            $deployCancel = $("#deploy_chaincode_cancel");

            $deployContract.on("change", function() {
                injectFunction($(this).val());
                $deployFunction.val("");
                $deployArgument.val("");
            });
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
                if (!$deployContract.val()) {
                    ui.dialog.warning("Please select a smart contract.");
                    $deployContract.focus();
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
                    url: "/api/contract/" + $deployContract.val() + "/deploy",
                    data: {
                        chain: list.chainId,
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
                            storage.set("deploy", $deployContract.val(), {
                                func: $deployFunction.val(),
                                args: deployArgs
                            });
                            $deployChaincodeDialog.hide();
                            ui.dialog.success("Deploy successfully.", 3000);
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
            $deployCancel.on("click", function() {
                $deployChaincodeDialog.hide();
            });
            loadContract();
        }
    }
    deploychaincode.prototype = {
        show: function() {
            var _self = this;
            $deploydialog = $(deploydialog);
            $deploydialog.on({
                "show.uk.modal": function() {
                    _self.init();
                },
                "hide.uk.modal": function() {
                    $(this).remove();
                }
            });
            $("body").append($deploydialog);
            $deployChaincodeDialog = UIkit.modal($deploydialog);
            $deployChaincodeDialog.options.center = true;
            $deployChaincodeDialog.show();
        }
    };
    return deploychaincode;
});