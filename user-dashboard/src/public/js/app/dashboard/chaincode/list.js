
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/10.
 */
define([
    "jquery",
    "app/kit/overlayer",
    "app/kit/ui",
    "app/kit/storage",
    "app/dashboard/chaincode/deploy",
    "app/dashboard/chaincode/invoke",
    "app/dashboard/chaincode/query",
    "plugin/text!resources/dashboard/chaincode/chaincode.html",
    "lodash"
], function($, Overlayer, UI, Storage, DeployChaincode, InvokeChaincode, QueryChaincode, chaincode) {
    var ui = new UI();
    var storage = new Storage();
    var $chaincodeContainer = $("#chaincodePanel tbody");
    var $chaincodeListPagination = $("#chaincodeListPagination");
    var $cache = $("#cache");
    var $deployBtn = $(".ico0");
    var $invokeBtn = $(".ico1");
    var $queryBtn = $(".ico2");

    function chaincodelist(chainId) {
        this.chainId = chainId;

        var deployChaincode = new DeployChaincode(this);
        var invokeChaincode = new InvokeChaincode(this);
        var queryChaincode = new QueryChaincode(this);

        function handler() {
            $(this).parents(".uk-dropdown").hide();
            if ($(this).data("type") == "invoke") {
                var chaincodeId = $(this).data("chaincodeId");
                invokeChaincode.show(chaincodeId);
            } else if ($(this).data("type") == "query") {
                var chaincodeId = $(this).data("chaincodeId");
                queryChaincode.show(chaincodeId);
            }
        }
        $chaincodeContainer.on("click", "li>a", handler);
        $chaincodeListPagination.on("select.uk.pagination", function(event, pageIndex) {
            this.search(pageIndex + 1);
        }.bind(this));
        $deployBtn.on("click", function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            deployChaincode.show();
            UIkit.Utils.scrollToElement(UIkit.$($("#sc-instance")[0]));
        });
        $invokeBtn.on("click", function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            invokeChaincode.show();
            UIkit.Utils.scrollToElement(UIkit.$($("#sc-instance")[0]));
        });
        $queryBtn.on("click", function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            queryChaincode.show();
            UIkit.Utils.scrollToElement(UIkit.$($("#sc-instance")[0]));
        });
        //将缓存中的默认函数名和参数存储到本地，清空缓存
        var cache = JSON.parse($cache.val());
        for(var i in cache) {
            storage.save("invoke", cache[i].id, cache[i].invoke);
            storage.save("query", cache[i].id, cache[i].query);
        }
        $cache.remove();
    }
    chaincodelist.prototype = {
        search: function(pageNo) {
            var _self = this;
            var overlayer = new Overlayer();
            overlayer.show();
            $.ajax({
                type: "GET",
                url: "/api/chain/" + this.chainId + "/chaincode/list",
                data: {
                    page: pageNo
                },
                dataType: "json",
                success: function(data) {
                    overlayer.hide();
                    if (data.success) {
                        $chaincodeContainer.empty();
                        if (data.chaincodes.length == 0) {
                            $chaincodeContainer.append("<tr><td colspan='3' class='no-result'>No result.</td></tr>");
                            $chaincodeListPagination.hide();
                        } else {
                            var chaincodeInfo = _.template(chaincode);
                            for (var i in data.chaincodes) {
                                var _chaincode = data.chaincodes[i];
                                $chaincodeContainer.append(chaincodeInfo({
                                    id: _chaincode.id,
                                    name: _chaincode.name,
                                    contract: _chaincode.contract.name,
                                    deployTime: _chaincode.deployTime
                                }));
                                //将默认函数名和参数存储到本地
                                storage.save("invoke", _self.chainId + "_" + _chaincode.id, _chaincode.contract.invoke);
                                storage.save("query", _self.chainId + "_" + _chaincode.id, _chaincode.contract.query);
                            }
                            $chaincodeListPagination.show();
                            if (pageNo > data.totalPage) pageNo = data.totalPage;
                            var $pagination = UIkit.pagination("#chaincodeListPagination");
                            $pagination.currentPage = pageNo - 1;
                            $pagination.render(data.totalPage);
                        }
                    } else {
                        ui.dialog.error(data.message);
                    }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    overlayer.hide();
                    ui.dialog.error(errorThrown);
                }
            });
        }
    };
    return chaincodelist;
});