
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/10.
 */
define([
    "jquery",
    "app/kit/ui",
    "app/kit/common",
    "app/kit/storage",
    "plugin/text!resources/dashboard/chaincode/invokedialog.html",
    "lodash"
], function($, UI, Common, Storage, invokedialog) {
    var ui = new UI();
    var common = new Common();
    var storage = new Storage();
    var $invokedialog;
    var $invokeChaincodeDialog;
    var $invokeInstanceView;
    var $invokeInstance;
    var $invokeFunction;
    var $functionListDropdown;
    var $functionList;
    var $invokeArgument;
    var $invokeSubmit;
    var $invokeCancel;

    function invokechaincode(list) {
        function disableAllElement(disabled) {
            if (disabled) {
                $invokeChaincodeDialog.options.bgclose = false;
            } else {
                $invokeChaincodeDialog.options.bgclose = true;
            }
            $invokeInstance.attr("disabled", disabled);
            $invokeFunction.attr("disabled", disabled);
            $invokeArgument.attr("disabled", disabled);
            $invokeSubmit.attr("disabled", disabled);
            $invokeCancel.attr("disabled", disabled);
        }
        function injectFunction(id) {
            //从本地存储中获取到函数名和参数
            var invoke = storage.get("invoke", id);
            $functionList.empty();
            for (var i in invoke) {
                $("<li data-args='" + _.escape(JSON.stringify(invoke[i].args)) + "'>" +
                    "<a>" + invoke[i].func + "</a>" +
                "</li>").click(function() {
                    $invokeFunction.val($(this).find("a").text());
                    $invokeArgument.val(JSON.stringify($(this).data("args")));
                }).appendTo($functionList);
            }
        }
        function loadInstance() {
            disableAllElement(true);
            $.ajax({
                type: "GET",
                url: "/api/chain/" + list.chainId + "/chaincode/list",
                data: {
                    page: -1
                },
                dataType: "json",
                success: function(data) {
                    disableAllElement(false);
                    if (data.success) {
                        $invokeInstance.empty();
                        for (var i in data.chaincodes) {
                            var chaincode = data.chaincodes[i];
                            $invokeInstance.append(
                                "<option value='" + chaincode.id + "'>" +
                                    chaincode.name +
                                "</option>");
                            //将默认函数名和参数存储到本地
                            storage.save("invoke", list.chainId + "_" + chaincode.id, chaincode.contract.invoke);
                        }
                        injectFunction(list.chainId + "_" + $invokeInstance.val());
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
            $invokeInstanceView = $("#invoke_chaincode_instance_view");
            $invokeInstance = $("#invoke_chaincode_instance");
            $invokeFunction = $("#invoke_chaincode_function");
            $functionListDropdown = $("#invoke_function_dropdown");
            $functionList = $("#invoke_function_dropdown ul");
            $invokeArgument = $("#invoke_chaincode_argument");
            $invokeSubmit = $("#invoke_chaincode_submit");
            $invokeCancel = $("#invoke_chaincode_cancel");

            if (id) {
                $invokeInstanceView.hide();
                injectFunction(list.chainId + "_" + id);
            } else {
                loadInstance();
                $invokeInstance.on("change", function() {
                    injectFunction(list.chainId + "_" + $(this).val());
                    $invokeFunction.val("");
                    $invokeArgument.val("");
                });
            }
            $invokeFunction.on("focus blur", function(evt) {
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
            $invokeSubmit.on("click", function() {
                if ($invokeInstanceView.css("display") != "none" && !$invokeInstance.val()) {
                    ui.dialog.warning("Please select a smart contract instance.");
                    $invokeInstance.focus();
                    return;
                } else if ($invokeFunction.val() == "") {
                    ui.dialog.warning("Please input the function name.");
                    $invokeFunction.focus();
                    return;
                } else if ($invokeArgument.val() == "") {
                    ui.dialog.warning("Please input the function arguments.");
                    $invokeArgument.focus();
                    return;
                }
                var invokeArgs = common.parseJSON($invokeArgument.val());
                if (!invokeArgs) {
                    ui.dialog.warning("Please input valid function arguments.");
                    $invokeArgument.focus();
                    return;
                }
                var $spinner = $("<i class='uk-icon-spinner uk-icon-spin'></i>");
                disableAllElement(true);
                $(this).append($spinner);
                var chaincodeId;
                if ($invokeInstanceView.css("display") != "none") {
                    chaincodeId = $invokeInstance.val();
                } else {
                    chaincodeId = id;
                }
                $.ajax({
                    type: "POST",
                    url: "/api/chain/" + list.chainId + "/chaincode/invoke",
                    data: {
                        id: chaincodeId,
                        func: $invokeFunction.val(),
                        args: $invokeArgument.val()
                    },
                    dataType: "json",
                    success: function(data) {
                        $spinner.remove();
                        disableAllElement(false);
                        if (data.success) {
                            //本地存储用户输入的函数名和参数
                            storage.set("invoke", list.chainId + "_" + chaincodeId, {
                                func: $invokeFunction.val(),
                                args: invokeArgs
                            });
                            $invokeChaincodeDialog.hide();
                            ui.dialog.success("Invoke successfully.", 3000);
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
            $invokeCancel.on("click", function() {
                $invokeChaincodeDialog.hide();
            });
        }
    }
    invokechaincode.prototype = {
        show: function(id) {
            var _self = this;
            $invokedialog = $(invokedialog);
            $invokedialog.on({
                "show.uk.modal": function() {
                    _self.init(id);
                },
                "hide.uk.modal": function() {
                    $(this).remove();
                }
            });
            $("body").append($invokedialog);
            $invokeChaincodeDialog = UIkit.modal($invokedialog);
            $invokeChaincodeDialog.options.center = true;
            $invokeChaincodeDialog.show();
        }
    };
    return invokechaincode;
});