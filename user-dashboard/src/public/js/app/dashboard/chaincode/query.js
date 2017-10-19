
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
    "plugin/text!resources/dashboard/chaincode/querydialog.html",
    "lodash"
], function($, UI, Common, Storage, querydialog) {
    var ui = new UI();
    var common = new Common();
    var storage = new Storage();
    var $querydialog;
    var $queryChaincodeDialog;
    var $queryInstanceView;
    var $queryInstance;
    var $queryFunction;
    var $functionListDropdown;
    var $functionList;
    var $queryArgument;
    var $querySubmit;
    var $queryCancel;

    function querychaincode(list) {
        function disableAllElement(disabled) {
            if (disabled) {
                $queryChaincodeDialog.options.bgclose = false;
            } else {
                $queryChaincodeDialog.options.bgclose = true;
            }
            $queryInstance.attr("disabled", disabled);
            $queryFunction.attr("disabled", disabled);
            $queryArgument.attr("disabled", disabled);
            $querySubmit.attr("disabled", disabled);
            $queryCancel.attr("disabled", disabled);
        }
        function injectFunction(id) {
            //从本地存储中获取到函数名和参数
            var query = storage.get("query", id);
            $functionList.empty();
            for (var i in query) {
                $("<li data-args='" + _.escape(JSON.stringify(query[i].args)) + "'>" +
                    "<a>" + query[i].func + "</a>" +
                "</li>").click(function() {
                    $queryFunction.val($(this).find("a").text());
                    $queryArgument.val(JSON.stringify($(this).data("args")));
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
                        $queryInstance.empty();
                        for (var i in data.chaincodes) {
                            var chaincode = data.chaincodes[i];
                            $queryInstance.append(
                                "<option value='" + chaincode.id + "'>" +
                                    chaincode.name +
                                "</option>");
                            //将默认函数名和参数存储到本地
                            storage.save("query", list.chainId + "_" + chaincode.id, chaincode.contract.query);
                        }
                        injectFunction(list.chainId + "_" + $queryInstance.val());
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
            $queryInstanceView = $("#query_chaincode_instance_view");
            $queryInstance = $("#query_chaincode_instance");
            $queryFunction = $("#query_chaincode_function");
            $functionListDropdown = $("#query_function_dropdown");
            $functionList = $("#query_function_dropdown ul");
            $queryArgument = $("#query_chaincode_argument");
            $querySubmit = $("#query_chaincode_submit");
            $queryCancel = $("#query_chaincode_cancel");

            if (id) {
                $queryInstanceView.hide();
                injectFunction(list.chainId + "_" + id);
            } else {
                loadInstance();
                $queryInstance.on("change", function() {
                    injectFunction(list.chainId + "_" + $(this).val());
                    $queryFunction.val("");
                    $queryArgument.val("");
                });
            }
            $queryFunction.on("focus blur", function(evt) {
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
            $querySubmit.on("click", function() {
                if ($queryInstanceView.css("display") != "none" && !$queryInstance.val()) {
                    ui.dialog.warning("Please select a smart contract instance.");
                    $queryInstance.focus();
                    return;
                } else if ($queryFunction.val() == "") {
                    ui.dialog.warning("Please input the function name.");
                    $queryFunction.focus();
                    return;
                } else if ($queryArgument.val() == "") {
                    ui.dialog.warning("Please input the function arguments.");
                    $queryArgument.focus();
                    return;
                }
                var queryArgs = common.parseJSON($queryArgument.val());
                if (!queryArgs) {
                    ui.dialog.warning("Please input valid function arguments.");
                    $queryArgument.focus();
                    return;
                }
                var $spinner = $("<i class='uk-icon-spinner uk-icon-spin'></i>");
                disableAllElement(true);
                $(this).append($spinner);
                var chaincodeId;
                if ($queryInstanceView.css("display") != "none") {
                    chaincodeId = $queryInstance.val();
                } else {
                    chaincodeId = id;
                }
                $.ajax({
                    type: "POST",
                    url: "/api/chain/" + list.chainId + "/chaincode/query",
                    data: {
                        id: chaincodeId,
                        func: $queryFunction.val(),
                        args: $queryArgument.val()
                    },
                    dataType: "json",
                    success: function(data) {
                        $spinner.remove();
                        disableAllElement(false);
                        if (data.success) {
                            //本地存储用户输入的函数名和参数
                            storage.set("query", list.chainId + "_" + chaincodeId, {
                                func: $queryFunction.val(),
                                args: queryArgs
                            });
                            var response = data.result;
                            $queryChaincodeDialog.hide();
                            try {
                                ui.dialog.info("Response: " +
                                    "<pre class='uk-margin-remove notify-message'>" +
                                        JSON.stringify(JSON.parse(response.message), null, 4) +
                                    "</pre>", 5000);
                            } catch (err) {
                                ui.dialog.info("Response: " +
                                    "<pre class='uk-margin-remove notify-message'>" +
                                        response.message +
                                    "</pre>", 5000);
                            }
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
            $queryCancel.on("click", function() {
                $queryChaincodeDialog.hide();
            });
        }
    }
    querychaincode.prototype = {
        show: function(id) {
            var _self = this;
            $querydialog = $(querydialog);
            $querydialog.on({
                "show.uk.modal": function() {
                    _self.init(id);
                },
                "hide.uk.modal": function() {
                    $(this).remove();
                }
            });
            $("body").append($querydialog);
            $queryChaincodeDialog = UIkit.modal($querydialog);
            $queryChaincodeDialog.options.center = true;
            $queryChaincodeDialog.show();
        }
    };
    return querychaincode;
});