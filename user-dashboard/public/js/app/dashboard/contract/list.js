
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/8.
 */
define([
    "jquery",
    "cookie",
    "app/dashboard/profile",
    "app/kit/overlayer",
    "app/kit/ui",
    "app/kit/storage",
    "app/dashboard/contract/upload",
    "app/dashboard/contract/deploy",
    "app/dashboard/contract/edit",
    "app/dashboard/contract/delete",
    "plugin/text!resources/dashboard/contract/contract.html",
    "uikit",
    "lodash"
], function($, Cookies, Profile, Overlayer, UI, Storage,
            UploadContract, DeployContract, EditContract, DeleteContract, contract) {
    $(function() {
        new Profile();

        var ui = new UI();
        var storage = new Storage();
        var $contractContainer = $("tbody");
        var $publicContractContainer = $contractContainer.eq(0);
        var $privateContractContainer = $contractContainer.eq(1);
        var $publicContractPagination = $("#publicContractPagination");
        var $privateContractPagination = $("#privateContractPagination");
        var $uploadBtn = $(".add-section a").eq(1);
        var $cache = $("#cache");

        function contractlist() {
            var uploadContract = new UploadContract(this);
            var deployContract = new DeployContract();
            var editContract = new EditContract(this);
            var deleteContract = new DeleteContract(this);
            function handler() {
                $(this).parents(".uk-dropdown").hide();
                if ($(this).data("type") == "deploy") {
                    deployContract.show($(this).data("contractId"));
                } else if ($(this).data("type") == "edit") {
                    var id = $(this).data("contractId");
                    var name = $(this).data("contractName");
                    var description = $(this).data("contractDescription");
                    var version = $(this).data("contractVersion");
                    var author = $(this).data("contractAuthor");
                    editContract.show(id, name, _.replace(description, "<br>", "\n"), version, author);
                } else if ($(this).data("type") == "delete") {
                    deleteContract.show($(this).data("contractId"));
                }
            }
            $contractContainer.on("click", "li>a", handler);
            $publicContractPagination.on("select.uk.pagination", function(event, pageIndex) {
                this.search("public", pageIndex + 1);
            }.bind(this));
            $privateContractPagination.on("select.uk.pagination", function(event, pageIndex) {
                this.search("private", pageIndex + 1);
            }.bind(this));
            $uploadBtn.on("click", function() {
                uploadContract.show();
            });
            //将缓存中的默认函数名和参数存储到本地，清空缓存
            var cache = JSON.parse($cache.val());
            for(var i in cache) {
                storage.save("deploy", cache[i].id, cache[i].deploy);
            }
            $cache.remove();
        }
        contractlist.prototype = {
            search: function(group, pageNo) {
                var userInfo = Cookies.getJSON("BlockChainAccount");
                var overlayer = new Overlayer();
                overlayer.show();
                $.ajax({
                    type: "GET",
                    url: "/api/" + userInfo.apikey + "/contract/list/" + group,
                    data: {
                        page: pageNo
                    },
                    dataType: "json",
                    success: function(data) {
                        overlayer.hide();
                        if (data.success) {
                            var contractInfo = _.template(contract);
                            var $container, $pagination, UIkitPagination;
                            if (group == "public") {
                                $container = $publicContractContainer;
                                $pagination = $publicContractPagination;
                                UIkitPagination = UIkit.pagination("#publicContractPagination");
                            } else if (group == "private") {
                                $container = $privateContractContainer;
                                $pagination = $privateContractPagination;
                                UIkitPagination = UIkit.pagination("#privateContractPagination");
                            }
                            $container.empty();
                            if (data.contracts.length == 0) {
                                $container.append("<tr><td colspan='4' class='no-result'>No result.</td></tr>");
                                $pagination.hide();
                            } else {
                                for (var i in data.contracts) {
                                    var _contract = data.contracts[i];
                                    $container.append(contractInfo({
                                        id: _contract.id,
                                        name: _contract.name,
                                        description: _contract.description,
                                        version: _contract.version,
                                        author: _contract.author,
                                        private_contract: _contract.group != "public"
                                    }));
                                    //将默认函数名和参数存储到本地
                                    storage.save("deploy", _contract.id, _contract.deploy);
                                }
                                $pagination.show();
                                if (pageNo > data.totalPage) pageNo = data.totalPage;
                                UIkitPagination.currentPage = pageNo - 1;
                                UIkitPagination.render(data.totalPage);
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
            },
            getCurrentPage: function(group) {
                var $pagination;
                if (group == "public") {
                    $pagination = UIkit.pagination("#publicContractPagination");
                } else {
                    $pagination = UIkit.pagination("#privateContractPagination");
                }
                return $pagination.currentPage + 1;
            }
        };
        new contractlist();
    });
});